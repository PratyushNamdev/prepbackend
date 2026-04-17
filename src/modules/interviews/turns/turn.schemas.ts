import { z } from "zod";
import { sessionStatusSchema } from "../sessions/session.schemas.js";

export const submitTurnSchema = z.object({
  answerText: z.string().trim().min(1).max(10000),
  clientTurnId: z.string().trim().min(3).max(120),
  audioUrl: z.string().url().max(1000).optional(),
  transcriptConfidence: z.number().min(0).max(1).optional()
});

export const turnResponseSchema = z.object({
  turnId: z.string().uuid(),
  evaluation: z.object({
    scoreOverall: z.number(),
    scoreTechnical: z.number(),
    scoreCommunication: z.number(),
    scoreStructure: z.number(),
    scoreConfidence: z.number(),
    scoreAccuracy: z.number().nullable(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    followUpRecommended: z.boolean(),
    followUpReason: z.string().nullable(),
    improvementTip: z.string()
  }),
  nextQuestion: z
    .object({
      questionText: z.string(),
      questionIndex: z.number(),
      topic: z.string()
    })
    .nullable(),
  sessionStatus: sessionStatusSchema,
  currentQuestionIndex: z.number()
});

export type SubmitTurnInput = z.infer<typeof submitTurnSchema>;
export type TurnResponse = z.infer<typeof turnResponseSchema>;
