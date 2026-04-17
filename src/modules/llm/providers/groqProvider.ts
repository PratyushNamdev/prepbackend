import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import { Prisma } from "@prisma/client";
import { durationMs } from "../../../common/utils/time.js";
import { logger } from "../../../observability/logger.js";
import {
  llmEvaluationOutputSchema,
  llmFinalFeedbackOutputSchema,
  llmQuestionOutputSchema,
  type LlmEvaluationOutput,
  type LlmFinalFeedbackOutput,
  type LlmQuestionOutput
} from "../schemas/llmOutput.schemas.js";
import type { EvaluationContext, FinalFeedbackContext, LlmProvider, QuestionContext } from "./llmProvider.interface.js";
import { buildEvaluationPrompt, buildInterviewerPrompt } from "../../interviews/prompts/interviewerPrompt.js";
import { buildFinalFeedbackPrompt } from "../../interviews/prompts/finalFeedbackPrompt.js";
import { errors } from "../../../common/errors/AppError.js";

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: unknown;
};

export class GroqProvider implements LlmProvider {
  readonly name = "groq";
  private readonly endpoint = "https://api.groq.com/openai/v1/chat/completions";
  private readonly timeoutMs = 12000;

  async generateNextQuestion(context: QuestionContext): Promise<LlmQuestionOutput> {
    return this.withRetry("generateNextQuestion", context.sessionId, null, async (strict) => {
      const content = await this.callGroq(buildInterviewerPrompt(context, strict), context.sessionId, null);
      return llmQuestionOutputSchema.parse(this.parseJson(content));
    });
  }

  async evaluateAnswer(context: EvaluationContext): Promise<LlmEvaluationOutput> {
    return this.withRetry("evaluateAnswer", context.sessionId, context.turnId ?? null, async () => {
      const content = await this.callGroq(buildEvaluationPrompt(context), context.sessionId, context.turnId ?? null);
      return llmEvaluationOutputSchema.parse(this.parseJson(content));
    });
  }

  async generateFinalFeedback(context: FinalFeedbackContext): Promise<LlmFinalFeedbackOutput> {
    return this.withRetry("generateFinalFeedback", context.sessionId, null, async () => {
      const content = await this.callGroq(buildFinalFeedbackPrompt(context), context.sessionId, null);
      return llmFinalFeedbackOutputSchema.parse(this.parseJson(content));
    });
  }

  private async withRetry<T>(
    operation: string,
    sessionId: string,
    turnId: string | null,
    fn: (strict: boolean) => Promise<T>
  ): Promise<T> {
    let lastError: unknown;
    for (const strict of [false, true]) {
      try {
        return await fn(strict);
      } catch (error) {
        lastError = error;
        logger.warn({ err: error, provider: this.name, operation, sessionId, turnId, strict }, "llm_retry");
      }
    }
    throw lastError instanceof Error ? lastError : errors.malformedProviderOutput(this.name);
  }

  private async callGroq(prompt: string, sessionId: string, turnId: string | null): Promise<string> {
    if (!env.GROQ_API_KEY) throw errors.providerTimeout(this.name);

    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const requestPayload = {
      model: env.GROQ_MODEL_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.25,
      max_tokens: 700,
      response_format: { type: "json_object" }
    };

    try {
      logger.info({ provider: this.name, sessionId, turnId }, "provider_request_start");
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.GROQ_API_KEY}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });
      const responsePayload = (await response.json()) as GroqResponse;
      const latencyMs = durationMs(startedAt);
      await this.logProviderCall(sessionId, turnId, requestPayload, responsePayload, response.ok, response.status, latencyMs);
      logger.info({ provider: this.name, sessionId, turnId, latencyMs, success: response.ok }, "provider_request_end");
      if (!response.ok) throw errors.providerTimeout(this.name);
      const content = responsePayload.choices?.[0]?.message?.content;
      if (!content) throw errors.malformedProviderOutput(this.name);
      return content;
    } catch (error) {
      const latencyMs = durationMs(startedAt);
      await this.logProviderCall(sessionId, turnId, requestPayload, null, false, null, latencyMs, error);
      logger.warn({ err: error, provider: this.name, sessionId, turnId, latencyMs }, "provider_failure");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseJson(content: string): unknown {
    try {
      return JSON.parse(content);
    } catch {
      const match = /\{[\s\S]*\}/.exec(content);
      if (!match) throw errors.malformedProviderOutput(this.name);
      return JSON.parse(match[0]);
    }
  }

  private async logProviderCall(
    sessionId: string,
    turnId: string | null,
    requestPayload: unknown,
    responsePayload: unknown,
    success: boolean,
    statusCode: number | null,
    latencyMs: number,
    error?: unknown
  ) {
    await prisma.providerLog.create({
      data: {
        sessionId,
        turnId,
        providerType: "llm",
        providerName: this.name,
        requestPayload: requestPayload as object,
        responsePayload: responsePayload === null ? Prisma.JsonNull : (responsePayload as object),
        success,
        statusCode,
        errorCode: error instanceof Error ? error.name : null,
        errorMessage: error instanceof Error ? error.message : null,
        latencyMs
      }
    }).catch((logError) => logger.warn({ err: logError }, "provider_log_failed"));
  }
}
