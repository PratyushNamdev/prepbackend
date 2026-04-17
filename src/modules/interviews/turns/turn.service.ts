import { prisma } from "../../../config/prisma.js";
import { errors } from "../../../common/errors/AppError.js";
import { getIdempotentResponse, saveIdempotentResponse } from "../../../common/utils/idempotency.js";
import { durationMs } from "../../../common/utils/time.js";
import { logger } from "../../../observability/logger.js";
import { llmOrchestrator } from "../../llm/orchestrator/llmOrchestrator.js";
import { scoringService } from "../scoring/scoring.service.js";
import { feedbackService } from "../feedback/feedback.service.js";
import { assertTransition } from "../sessions/session.stateMachine.js";
import { sessionRepository } from "../sessions/session.repository.js";
import { turnRepository } from "./turn.repository.js";
import type { SubmitTurnInput, TurnResponse } from "./turn.schemas.js";

export class TurnService {
  async submit(userId: string, sessionId: string, input: SubmitTurnInput): Promise<TurnResponse> {
    const scope = `session:${sessionId}:turn`;
    const existingResponse = await getIdempotentResponse<TurnResponse>(scope, input.clientTurnId);
    if (existingResponse) return existingResponse;

    const startedAt = Date.now();
    const session = await sessionRepository.findOwned(sessionId, userId);
    if (!session) throw errors.notFound("Session not found");
    if (session.status !== "waiting_for_candidate") {
      throw errors.conflict(`Session is not waiting for candidate input; current status is ${session.status}`);
    }

    const existingTurn = await turnRepository.findByClientTurnId(sessionId, input.clientTurnId);
    if (existingTurn) {
      const saved = await getIdempotentResponse<TurnResponse>(scope, input.clientTurnId);
      if (saved) return saved;
      throw errors.conflict("Duplicate clientTurnId exists but response is unavailable");
    }

    const questionTurn = session.turns.find(
      (turn) => turn.speaker === "interviewer" && turn.turnIndex === session.currentQuestionIndex
    );
    if (!questionTurn?.questionText) throw errors.conflict("No active interviewer question found");

    assertTransition(session.status, "evaluating");
    await sessionRepository.updateStatus(sessionId, "evaluating");

    const candidateTurn = await turnRepository.create({
      sessionId,
      turnIndex: session.currentQuestionIndex,
      speaker: "candidate",
      answerText: input.answerText,
      audioUrl: input.audioUrl,
      transcriptConfidence: input.transcriptConfidence,
      clientTurnId: input.clientTurnId,
      latencyMs: durationMs(startedAt)
    });

    logger.info({ userId, sessionId, turnId: candidateTurn.id }, "turn_submitted");

    const normalizedEvaluation = scoringService.normalizeEvaluation(
      await llmOrchestrator.evaluateAnswer({
        sessionId,
        turnId: candidateTurn.id,
        mode: session.mode,
        difficulty: session.difficulty,
        language: session.language,
        questionText: questionTurn.questionText,
        answerText: input.answerText
      })
    );

    const evaluation = await turnRepository.createEvaluation({
      turnId: candidateTurn.id,
      sessionId,
      scoreOverall: normalizedEvaluation.scoreOverall,
      scoreTechnical: normalizedEvaluation.scoreTechnical,
      scoreCommunication: normalizedEvaluation.scoreCommunication,
      scoreStructure: normalizedEvaluation.scoreStructure,
      scoreConfidence: normalizedEvaluation.scoreConfidence,
      scoreAccuracy: normalizedEvaluation.scoreAccuracy,
      strengths: normalizedEvaluation.strengths,
      weaknesses: normalizedEvaluation.weaknesses,
      followUpRecommended: normalizedEvaluation.followUpRecommended,
      followUpReason: normalizedEvaluation.followUpReason ?? null,
      improvementTip: normalizedEvaluation.improvementTip,
      modelName: "llm-orchestrator",
      rawModelOutput: normalizedEvaluation
    });

    logger.info({ userId, sessionId, turnId: candidateTurn.id, scoreOverall: normalizedEvaluation.scoreOverall }, "scoring_output");

    const nextIndex = session.currentQuestionIndex + 1;
    let response: TurnResponse;

    if (nextIndex >= session.totalQuestionsTarget) {
      assertTransition("evaluating", "completed");
      await sessionRepository.updateStatus(sessionId, "completed", { endedAt: new Date() });
      await feedbackService.generate(sessionId, userId);
      response = {
        turnId: candidateTurn.id,
        evaluation: this.formatEvaluation(evaluation),
        nextQuestion: null,
        sessionStatus: "completed",
        currentQuestionIndex: session.currentQuestionIndex
      };
    } else {
      assertTransition("evaluating", "generating_next_question");
      await sessionRepository.updateStatus(sessionId, "generating_next_question");
      const nextQuestion = await llmOrchestrator.generateNextQuestion({
        sessionId,
        mode: session.mode,
        difficulty: session.difficulty,
        language: session.language,
        questionIndex: nextIndex,
        totalQuestionsTarget: session.totalQuestionsTarget,
        previousQuestion: questionTurn.questionText,
        previousAnswer: input.answerText,
        previousEvaluation: {
          scoreOverall: normalizedEvaluation.scoreOverall,
          strengths: normalizedEvaluation.strengths,
          weaknesses: normalizedEvaluation.weaknesses,
          followUpRecommended: normalizedEvaluation.followUpRecommended
        }
      });

      await turnRepository.create({
        sessionId,
        turnIndex: nextIndex,
        speaker: "interviewer",
        questionText: nextQuestion.questionText,
        clientTurnId: `system-question-${nextIndex}`
      });

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: "waiting_for_candidate",
          currentQuestionIndex: nextIndex,
          lastActivityAt: new Date()
        }
      });

      response = {
        turnId: candidateTurn.id,
        evaluation: this.formatEvaluation(evaluation),
        nextQuestion: {
          questionText: nextQuestion.questionText,
          questionIndex: nextIndex,
          topic: nextQuestion.topic
        },
        sessionStatus: "waiting_for_candidate",
        currentQuestionIndex: nextIndex
      };
    }

    await saveIdempotentResponse(scope, input.clientTurnId, response);
    return response;
  }

  private formatEvaluation(evaluation: {
    scoreOverall: unknown;
    scoreTechnical: unknown;
    scoreCommunication: unknown;
    scoreStructure: unknown;
    scoreConfidence: unknown;
    scoreAccuracy: unknown;
    strengths: unknown;
    weaknesses: unknown;
    followUpRecommended: boolean;
    followUpReason: string | null;
    improvementTip: string;
  }) {
    return {
      scoreOverall: Number(evaluation.scoreOverall),
      scoreTechnical: Number(evaluation.scoreTechnical),
      scoreCommunication: Number(evaluation.scoreCommunication),
      scoreStructure: Number(evaluation.scoreStructure),
      scoreConfidence: Number(evaluation.scoreConfidence),
      scoreAccuracy: evaluation.scoreAccuracy === null || evaluation.scoreAccuracy === undefined ? null : Number(evaluation.scoreAccuracy),
      strengths: evaluation.strengths as string[],
      weaknesses: evaluation.weaknesses as string[],
      followUpRecommended: evaluation.followUpRecommended,
      followUpReason: evaluation.followUpReason,
      improvementTip: evaluation.improvementTip
    };
  }
}

export const turnService = new TurnService();
