import { logger } from "../../../observability/logger.js";
import { GroqProvider } from "../providers/groqProvider.js";
import { FallbackProvider } from "../providers/fallbackProvider.js";
import type {
  EvaluationContext,
  FinalFeedbackContext,
  LlmProvider,
  QuestionContext
} from "../providers/llmProvider.interface.js";

export class LlmOrchestrator implements LlmProvider {
  readonly name = "llm-orchestrator";

  constructor(
    private readonly primary: LlmProvider = new GroqProvider(),
    private readonly fallback: LlmProvider = new FallbackProvider()
  ) {}

  async generateNextQuestion(context: QuestionContext) {
    try {
      return await this.primary.generateNextQuestion(context);
    } catch (error) {
      logger.warn({ err: error, sessionId: context.sessionId }, "llm_question_fallback");
      return this.fallback.generateNextQuestion(context);
    }
  }

  async evaluateAnswer(context: EvaluationContext) {
    try {
      return await this.primary.evaluateAnswer(context);
    } catch (error) {
      logger.warn({ err: error, sessionId: context.sessionId, turnId: context.turnId }, "llm_evaluation_fallback");
      return this.fallback.evaluateAnswer(context);
    }
  }

  async generateFinalFeedback(context: FinalFeedbackContext) {
    try {
      return await this.primary.generateFinalFeedback(context);
    } catch (error) {
      logger.warn({ err: error, sessionId: context.sessionId }, "llm_feedback_fallback");
      return this.fallback.generateFinalFeedback(context);
    }
  }
}

export const llmOrchestrator = new LlmOrchestrator();
