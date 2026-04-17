import type { Difficulty, InterviewLanguage, InterviewMode } from "@prisma/client";

export const buildFinalFeedbackPrompt = (context: {
  mode: InterviewMode;
  difficulty: Difficulty;
  language: InterviewLanguage;
  turns: Array<{
    questionText: string | null;
    answerText: string | null;
    scoreOverall?: number;
    strengths?: string[];
    weaknesses?: string[];
  }>;
}): string =>
  [
    "You are preparing final interview feedback for an Indian CS student.",
    "Be honest, specific, and useful. Do not exaggerate readiness.",
    `Mode: ${context.mode}. Difficulty: ${context.difficulty}. Language: ${context.language}.`,
    `Turns: ${JSON.stringify(context.turns)}`,
    "Return JSON only with keys: summary, strengths, weaknesses, actionPlan, recommendedTopics, nextSessionFocus, readinessEstimate."
  ].join("\n");
