import { llmOrchestrator } from "../../llm/orchestrator/llmOrchestrator.js";
import { scoringService } from "../scoring/scoring.service.js";
import { feedbackRepository } from "./feedback.repository.js";
import { sessionRepository } from "../sessions/session.repository.js";
import { errors } from "../../../common/errors/AppError.js";

export class FeedbackService {
  async getOrGenerate(sessionId: string, userId: string) {
    const existing = await feedbackRepository.findBySessionId(sessionId);
    if (existing) return this.format(existing);

    const session = await sessionRepository.findOwned(sessionId, userId);
    if (!session) throw errors.notFound("Session not found");
    return this.generate(sessionId, userId);
  }

  async generate(sessionId: string, userId: string) {
    const session = await sessionRepository.findOwned(sessionId, userId);
    if (!session) throw errors.notFound("Session not found");

    const candidateTurns = session.turns.filter((turn) => turn.speaker === "candidate");
    const output = await llmOrchestrator.generateFinalFeedback({
      sessionId: session.id,
      mode: session.mode,
      difficulty: session.difficulty,
      language: session.language,
      turns: candidateTurns.map((turn) => {
        const evaluation = session.evaluations.find((item) => item.turnId === turn.id);
        return {
          questionText: session.turns.find((item) => item.turnIndex === turn.turnIndex && item.speaker === "interviewer")?.questionText ?? null,
          answerText: turn.answerText,
          scoreOverall: evaluation ? Number(evaluation.scoreOverall) : undefined,
          strengths: evaluation ? (evaluation.strengths as string[]) : undefined,
          weaknesses: evaluation ? (evaluation.weaknesses as string[]) : undefined
        };
      })
    });

    const feedback = await feedbackRepository.upsert(sessionId, {
      summary: output.summary,
      strengths: output.strengths,
      weaknesses: output.weaknesses,
      actionPlan: output.actionPlan,
      recommendedTopics: output.recommendedTopics,
      nextSessionFocus: output.nextSessionFocus,
      readinessEstimate: output.readinessEstimate
    });

    const scores = scoringService.aggregateSessionScores(session.evaluations);
    await sessionRepository.updateScores(sessionId, {
      ...scores,
      sessionSummary: output.summary,
      endedAt: session.endedAt ?? new Date()
    });

    return this.format(feedback);
  }

  private format(feedback: {
    summary: string;
    strengths: unknown;
    weaknesses: unknown;
    actionPlan: unknown;
    recommendedTopics: unknown;
    nextSessionFocus: string;
    readinessEstimate: string | null;
  }) {
    return {
      summary: feedback.summary,
      strengths: feedback.strengths as string[],
      weaknesses: feedback.weaknesses as string[],
      actionPlan: feedback.actionPlan as string[],
      recommendedTopics: feedback.recommendedTopics as string[],
      nextSessionFocus: feedback.nextSessionFocus,
      readinessEstimate: feedback.readinessEstimate
    };
  }
}

export const feedbackService = new FeedbackService();
