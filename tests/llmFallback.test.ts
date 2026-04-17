import { describe, expect, it } from "vitest";
import { LlmOrchestrator } from "../src/modules/llm/orchestrator/llmOrchestrator.js";
import type { LlmProvider } from "../src/modules/llm/providers/llmProvider.interface.js";

const failingProvider: LlmProvider = {
  name: "failing",
  generateNextQuestion: async () => {
    throw new Error("malformed");
  },
  evaluateAnswer: async () => {
    throw new Error("timeout");
  },
  generateFinalFeedback: async () => {
    throw new Error("timeout");
  }
};

describe("llm fallback", () => {
  it("falls back for malformed next question output", async () => {
    const orchestrator = new LlmOrchestrator(failingProvider);
    const output = await orchestrator.generateNextQuestion({
      sessionId: "00000000-0000-0000-0000-000000000001",
      mode: "dsa",
      difficulty: "easy",
      language: "en",
      questionIndex: 0,
      totalQuestionsTarget: 3
    });
    expect(output.questionText.length).toBeGreaterThan(10);
    expect(output.questionIndex).toBe(0);
  });

  it("falls back for provider timeout during evaluation", async () => {
    const orchestrator = new LlmOrchestrator(failingProvider);
    const output = await orchestrator.evaluateAnswer({
      sessionId: "00000000-0000-0000-0000-000000000001",
      mode: "dsa",
      difficulty: "easy",
      language: "en",
      questionText: "Explain arrays.",
      answerText: "Arrays store elements contiguously and provide O(1) indexed access."
    });
    expect(output.scoreOverall).toBeGreaterThanOrEqual(0);
    expect(output.followUpRecommended).toEqual(expect.any(Boolean));
  });
});
