import type { TurnEvaluation } from "@prisma/client";
import type { LlmEvaluationOutput } from "../../llm/schemas/llmOutput.schemas.js";
import type { ScoreAggregate } from "./scoring.types.js";

const clamp = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

export class ScoringService {
  normalizeEvaluation(evaluation: LlmEvaluationOutput): LlmEvaluationOutput {
    return {
      ...evaluation,
      scoreOverall: clamp(evaluation.scoreOverall),
      scoreTechnical: clamp(evaluation.scoreTechnical),
      scoreCommunication: clamp(evaluation.scoreCommunication),
      scoreStructure: clamp(evaluation.scoreStructure),
      scoreConfidence: clamp(evaluation.scoreConfidence),
      scoreAccuracy: evaluation.scoreAccuracy === undefined ? undefined : clamp(evaluation.scoreAccuracy)
    };
  }

  aggregateSessionScores(evaluations: TurnEvaluation[]): ScoreAggregate {
    const count = evaluations.length || 1;
    const avg = (selector: (evaluation: TurnEvaluation) => unknown) =>
      clamp(
        evaluations.reduce((sum, evaluation) => {
          const value = selector(evaluation);
          return sum + Number(value ?? 0);
        }, 0) / count
      );

    return {
      overallScore: avg((evaluation) => evaluation.scoreOverall),
      technicalScore: avg((evaluation) => evaluation.scoreTechnical),
      communicationScore: avg((evaluation) => evaluation.scoreCommunication),
      confidenceScore: avg((evaluation) => evaluation.scoreConfidence),
      clarityScore: avg((evaluation) => evaluation.scoreCommunication),
      depthScore: avg((evaluation) => evaluation.scoreAccuracy ?? evaluation.scoreTechnical)
    };
  }
}

export const scoringService = new ScoringService();
