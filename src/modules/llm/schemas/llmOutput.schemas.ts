import { z } from "zod";

const scoreSchema = z.number().min(0).max(100);
const nonEmptyStringArray = z.array(z.string().trim().min(1)).min(1).max(6);

export const llmQuestionOutputSchema = z.object({
  questionText: z.string().trim().min(10).max(800),
  questionIndex: z.number().int().min(0),
  topic: z.string().trim().min(2).max(80),
  difficulty: z.enum(["easy", "medium", "hard"]),
  rationale: z.string().trim().min(1).max(400).optional()
});

export const llmEvaluationOutputSchema = z.object({
  scoreOverall: scoreSchema,
  scoreTechnical: scoreSchema,
  scoreCommunication: scoreSchema,
  scoreStructure: scoreSchema,
  scoreConfidence: scoreSchema,
  scoreAccuracy: scoreSchema.optional(),
  strengths: nonEmptyStringArray,
  weaknesses: nonEmptyStringArray,
  followUpRecommended: z.boolean(),
  followUpReason: z.string().trim().max(400).nullable().optional(),
  improvementTip: z.string().trim().min(8).max(500)
});

export const llmFinalFeedbackOutputSchema = z.object({
  summary: z.string().trim().min(20).max(2000),
  strengths: nonEmptyStringArray,
  weaknesses: nonEmptyStringArray,
  actionPlan: nonEmptyStringArray,
  recommendedTopics: nonEmptyStringArray,
  nextSessionFocus: z.string().trim().min(8).max(500),
  readinessEstimate: z.string().trim().min(2).max(120).nullable()
});

export type LlmQuestionOutput = z.infer<typeof llmQuestionOutputSchema>;
export type LlmEvaluationOutput = z.infer<typeof llmEvaluationOutputSchema>;
export type LlmFinalFeedbackOutput = z.infer<typeof llmFinalFeedbackOutputSchema>;
