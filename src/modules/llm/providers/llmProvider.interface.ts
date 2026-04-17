import type { Difficulty, InterviewLanguage, InterviewMode } from "@prisma/client";
import type {
  LlmEvaluationOutput,
  LlmFinalFeedbackOutput,
  LlmQuestionOutput
} from "../schemas/llmOutput.schemas.js";

export type QuestionContext = {
  sessionId: string;
  mode: InterviewMode;
  difficulty: Difficulty;
  language: InterviewLanguage;
  questionIndex: number;
  totalQuestionsTarget: number;
  previousQuestion?: string | null;
  previousAnswer?: string | null;
  previousEvaluation?: {
    scoreOverall: number;
    strengths: string[];
    weaknesses: string[];
    followUpRecommended: boolean;
  } | null;
};

export type EvaluationContext = {
  sessionId: string;
  turnId?: string;
  mode: InterviewMode;
  difficulty: Difficulty;
  language: InterviewLanguage;
  questionText: string;
  answerText: string;
};

export type FinalFeedbackContext = {
  sessionId: string;
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
};

export interface LlmProvider {
  readonly name: string;
  generateNextQuestion(context: QuestionContext): Promise<LlmQuestionOutput>;
  evaluateAnswer(context: EvaluationContext): Promise<LlmEvaluationOutput>;
  generateFinalFeedback(context: FinalFeedbackContext): Promise<LlmFinalFeedbackOutput>;
}
