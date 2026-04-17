import { z } from "zod";

export const uuidParamsSchema = z.object({
  id: z.string().uuid()
});

export const createSessionSchema = z.object({
  mode: z.enum(["dsa", "core_cs", "mixed"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  language: z.enum(["en", "hinglish"]),
  totalQuestionsTarget: z.number().int().min(1).max(10).optional()
});

const questionSchema = z.object({
  questionText: z.string(),
  questionIndex: z.number().int().min(0),
  topic: z.string()
});

export const sessionStatusSchema = z.enum([
  "created",
  "active",
  "waiting_for_candidate",
  "evaluating",
  "generating_next_question",
  "paused",
  "completed",
  "failed",
  "expired"
]);

export const createSessionResponseSchema = z.object({
  sessionId: z.string().uuid(),
  status: sessionStatusSchema,
  firstQuestion: questionSchema
});

export const startSessionResponseSchema = z.object({
  sessionId: z.string().uuid(),
  status: sessionStatusSchema,
  firstQuestion: questionSchema
});

export const sessionListResponseSchema = z.object({
  sessions: z.array(
    z.object({
      id: z.string().uuid(),
      mode: z.string(),
      difficulty: z.string(),
      language: z.string(),
      status: sessionStatusSchema,
      currentQuestionIndex: z.number(),
      totalQuestionsTarget: z.number(),
      overallScore: z.number().nullable(),
      createdAt: z.string(),
      updatedAt: z.string()
    })
  )
});

export const sessionDetailResponseSchema = z.object({
  session: z.object({
    id: z.string().uuid(),
    mode: z.string(),
    difficulty: z.string(),
    language: z.string(),
    status: sessionStatusSchema,
    currentQuestionIndex: z.number(),
    totalQuestionsTarget: z.number(),
    scores: z.object({
      overallScore: z.number().nullable(),
      technicalScore: z.number().nullable(),
      communicationScore: z.number().nullable(),
      confidenceScore: z.number().nullable(),
      clarityScore: z.number().nullable(),
      depthScore: z.number().nullable()
    }),
    startedAt: z.string().nullable(),
    endedAt: z.string().nullable(),
    lastActivityAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
  })
});

export const transcriptResponseSchema = z.object({
  sessionId: z.string().uuid(),
  turns: z.array(
    z.object({
      id: z.string().uuid(),
      turnIndex: z.number(),
      speaker: z.string(),
      questionText: z.string().nullable(),
      answerText: z.string().nullable(),
      audioUrl: z.string().nullable(),
      transcriptConfidence: z.number().nullable(),
      createdAt: z.string()
    })
  )
});

export const progressResponseSchema = z.object({
  sessionId: z.string().uuid(),
  status: sessionStatusSchema,
  currentQuestionIndex: z.number(),
  totalQuestionsTarget: z.number(),
  completedTurns: z.number(),
  progressPercent: z.number()
});

export const stateChangeResponseSchema = z.object({
  sessionId: z.string().uuid(),
  status: sessionStatusSchema
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
