import type { InterviewSession, InterviewTurn, TurnEvaluation } from "@prisma/client";
import { env } from "../../../config/env.js";
import { SESSION_DEFAULTS } from "../../../common/constants/interview.js";
import { errors } from "../../../common/errors/AppError.js";
import { logger } from "../../../observability/logger.js";
import { llmOrchestrator } from "../../llm/orchestrator/llmOrchestrator.js";
import { feedbackService } from "../feedback/feedback.service.js";
import { turnRepository } from "../turns/turn.repository.js";
import { assertTransition } from "./session.stateMachine.js";
import { sessionRepository } from "./session.repository.js";
import type { CreateSessionInput } from "./session.schemas.js";

type SessionWithRelations = InterviewSession & {
  turns: InterviewTurn[];
  evaluations: TurnEvaluation[];
};

const decimalToNumber = (value: unknown): number | null => (value === null || value === undefined ? null : Number(value));

export class SessionService {
  async create(userId: string, input: CreateSessionInput) {
    const totalQuestionsTarget = input.totalQuestionsTarget ?? SESSION_DEFAULTS.totalQuestionsTarget;
    const session = await sessionRepository.create({
      userId,
      mode: input.mode,
      difficulty: input.difficulty,
      language: input.language,
      totalQuestionsTarget,
      providerLlm: env.GROQ_API_KEY ? "groq" : "deterministic-fallback",
      providerStt: SESSION_DEFAULTS.providerStt,
      providerTts: SESSION_DEFAULTS.providerTts,
      promptVersion: SESSION_DEFAULTS.promptVersion
    });

    const firstQuestion = await llmOrchestrator.generateNextQuestion({
      sessionId: session.id,
      mode: session.mode,
      difficulty: session.difficulty,
      language: session.language,
      questionIndex: 0,
      totalQuestionsTarget
    });

    await turnRepository.create({
      sessionId: session.id,
      turnIndex: 0,
      speaker: "interviewer",
      questionText: firstQuestion.questionText,
      clientTurnId: "system-question-0"
    });

    logger.info({ userId, sessionId: session.id }, "session_created");
    return {
      sessionId: session.id,
      status: session.status,
      firstQuestion: {
        questionText: firstQuestion.questionText,
        questionIndex: 0,
        topic: firstQuestion.topic
      }
    };
  }

  async list(userId: string) {
    const sessions = await sessionRepository.listOwned(userId);
    return {
      sessions: sessions.map((session) => ({
        id: session.id,
        mode: session.mode,
        difficulty: session.difficulty,
        language: session.language,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestionsTarget: session.totalQuestionsTarget,
        overallScore: decimalToNumber(session.overallScore),
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString()
      }))
    };
  }

  async get(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    return { session: this.formatSession(session) };
  }

  async start(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    assertTransition(session.status, "active");
    assertTransition("active", "waiting_for_candidate");
    await sessionRepository.updateStatus(sessionId, "active", { startedAt: new Date() });
    const updated = await sessionRepository.updateStatus(sessionId, "waiting_for_candidate");
    const firstQuestionTurn = session.turns.find((turn) => turn.speaker === "interviewer" && turn.turnIndex === 0);
    if (!firstQuestionTurn?.questionText) throw errors.conflict("Session has no first question");
    logger.info({ userId, sessionId }, "session_started");
    return {
      sessionId: updated.id,
      status: updated.status,
      firstQuestion: {
        questionText: firstQuestionTurn.questionText,
        questionIndex: 0,
        topic: "starter"
      }
    };
  }

  async pause(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    assertTransition(session.status, "paused");
    const updated = await sessionRepository.updateStatus(sessionId, "paused");
    logger.info({ userId, sessionId }, "session_paused");
    return { sessionId: updated.id, status: updated.status };
  }

  async resume(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    assertTransition(session.status, "active");
    assertTransition("active", "waiting_for_candidate");
    await sessionRepository.updateStatus(sessionId, "active");
    const updated = await sessionRepository.updateStatus(sessionId, "waiting_for_candidate");
    logger.info({ userId, sessionId }, "session_resumed");
    return { sessionId: updated.id, status: updated.status };
  }

  async complete(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    assertTransition(session.status, "completed");
    const updated = await sessionRepository.updateStatus(sessionId, "completed", {
      endedAt: new Date()
    });
    await feedbackService.generate(sessionId, userId);
    logger.info({ userId, sessionId }, "session_completed");
    return { sessionId: updated.id, status: updated.status };
  }

  async transcript(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    return {
      sessionId,
      turns: session.turns.map((turn) => ({
        id: turn.id,
        turnIndex: turn.turnIndex,
        speaker: turn.speaker,
        questionText: turn.questionText,
        answerText: turn.answerText,
        audioUrl: turn.audioUrl,
        transcriptConfidence: decimalToNumber(turn.transcriptConfidence),
        createdAt: turn.createdAt.toISOString()
      }))
    };
  }

  async progress(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    const completedTurns = session.turns.filter((turn) => turn.speaker === "candidate").length;
    return {
      sessionId,
      status: session.status,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestionsTarget: session.totalQuestionsTarget,
      completedTurns,
      progressPercent: Math.min(100, Math.round((completedTurns / session.totalQuestionsTarget) * 100))
    };
  }

  async getOwnedSession(userId: string, sessionId: string): Promise<SessionWithRelations> {
    const session = await sessionRepository.findOwned(sessionId, userId);
    if (!session) throw errors.notFound("Session not found");
    return session;
  }

  private formatSession(session: InterviewSession) {
    return {
      id: session.id,
      mode: session.mode,
      difficulty: session.difficulty,
      language: session.language,
      status: session.status,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestionsTarget: session.totalQuestionsTarget,
      scores: {
        overallScore: decimalToNumber(session.overallScore),
        technicalScore: decimalToNumber(session.technicalScore),
        communicationScore: decimalToNumber(session.communicationScore),
        confidenceScore: decimalToNumber(session.confidenceScore),
        clarityScore: decimalToNumber(session.clarityScore),
        depthScore: decimalToNumber(session.depthScore)
      },
      startedAt: session.startedAt?.toISOString() ?? null,
      endedAt: session.endedAt?.toISOString() ?? null,
      lastActivityAt: session.lastActivityAt?.toISOString() ?? null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString()
    };
  }
}

export const sessionService = new SessionService();
