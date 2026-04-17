import { z } from "zod";

export const feedbackResponseSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  actionPlan: z.array(z.string()),
  recommendedTopics: z.array(z.string()),
  nextSessionFocus: z.string(),
  readinessEstimate: z.string().nullable()
});
