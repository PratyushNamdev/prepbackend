import type { Difficulty, InterviewLanguage } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";
import { logger } from "../../../observability/logger.js";
import type {
  LlmEvaluationOutput,
  LlmFinalFeedbackOutput,
  LlmQuestionOutput
} from "../schemas/llmOutput.schemas.js";
import type { EvaluationContext, FinalFeedbackContext, LlmProvider, QuestionContext } from "./llmProvider.interface.js";

const clamp = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

export class FallbackProvider implements LlmProvider {
  readonly name = "deterministic-fallback";

  async generateNextQuestion(context: QuestionContext): Promise<LlmQuestionOutput> {
    const question = await this.pickQuestion(context.difficulty, context.language, context.questionIndex);
    logger.info({ sessionId: context.sessionId, provider: this.name }, "fallback_question_used");
    return {
      questionText: question?.questionText ?? this.defaultQuestion(context.questionIndex),
      questionIndex: context.questionIndex,
      topic: question?.topic ?? "fundamentals",
      difficulty: context.difficulty,
      rationale: "Fallback question selected because provider output was unavailable."
    };
  }

  async evaluateAnswer(context: EvaluationContext): Promise<LlmEvaluationOutput> {
    const words = context.answerText.trim().split(/\s+/).filter(Boolean).length;
    const scoreTechnical = clamp(words < 20 ? 35 : words < 60 ? 58 : 72);
    const scoreCommunication = clamp(context.answerText.includes(".") ? scoreTechnical + 8 : scoreTechnical);
    const scoreStructure = clamp(words > 40 ? scoreTechnical + 5 : scoreTechnical - 5);
    const scoreConfidence = clamp(context.answerText.length > 80 ? scoreTechnical + 4 : scoreTechnical - 8);
    const scoreOverall = clamp((scoreTechnical + scoreCommunication + scoreStructure + scoreConfidence) / 4);
    logger.info({ sessionId: context.sessionId, turnId: context.turnId, provider: this.name, scoreOverall }, "fallback_evaluation_used");
    return {
      scoreOverall,
      scoreTechnical,
      scoreCommunication,
      scoreStructure,
      scoreConfidence,
      scoreAccuracy: undefined,
      strengths: scoreOverall >= 60 ? ["Relevant answer with usable signal"] : ["Attempted the question"],
      weaknesses: scoreOverall >= 60 ? ["Needs more depth and examples"] : ["Answer lacks enough detail and structure"],
      followUpRecommended: scoreOverall < 70,
      followUpReason: scoreOverall < 70 ? "Score indicates a focused follow-up would clarify understanding." : null,
      improvementTip: "Structure the answer with the core idea, tradeoffs, complexity, and a short example."
    };
  }

  async generateFinalFeedback(context: FinalFeedbackContext): Promise<LlmFinalFeedbackOutput> {
    const scores = context.turns.map((turn) => turn.scoreOverall ?? 0).filter((score) => score > 0);
    const avg = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    return {
      summary: `The session is complete. Average answer quality was ${Math.round(avg)}/100 across ${context.turns.length} candidate turns.`,
      strengths: ["Completed the interview flow", avg >= 60 ? "Showed some technical grounding" : "Stayed engaged with the questions"],
      weaknesses: avg >= 60 ? ["Needs sharper depth and examples"] : ["Needs stronger fundamentals and answer structure"],
      actionPlan: [
        "Revise one core topic daily with notes",
        "Practice explaining answers in a problem, approach, tradeoff format",
        "Do timed mock answers for common interview questions"
      ],
      recommendedTopics: ["DSA fundamentals", "DBMS basics", "Operating systems"],
      nextSessionFocus: avg >= 60 ? "Push for deeper reasoning and edge cases." : "Focus on fundamentals and clearer answer structure.",
      readinessEstimate: avg >= 70 ? "moderate" : "needs practice"
    };
  }

  private pickQuestion(difficulty: Difficulty, language: InterviewLanguage, offset: number) {
    return prisma.sessionQuestionBank
      .findFirst({
        where: { difficulty, language },
        orderBy: { createdAt: "asc" },
        skip: offset % 3
      })
      .catch((error) => {
        logger.warn({ err: error, provider: this.name }, "fallback_question_bank_unavailable");
        return null;
      });
  }

  private defaultQuestion(index: number): string {
    const defaults = [
      "Explain the difference between an array and a linked list, including one tradeoff.",
      "How would you find whether a string has balanced parentheses?",
      "What happens when a process switches from user mode to kernel mode?"
    ];
    return defaults[index % defaults.length];
  }
}
