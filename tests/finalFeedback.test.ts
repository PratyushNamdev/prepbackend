import { describe, expect, it } from "vitest";
import { LlmOrchestrator } from "../src/modules/llm/orchestrator/llmOrchestrator.js";
import type { LlmProvider } from "../src/modules/llm/providers/llmProvider.interface.js";

const failingProvider: LlmProvider = {
  name: "failing",
  generateNextQuestion: async () => {
    throw new Error("unused");
  },
  evaluateAnswer: async () => {
    throw new Error("unused");
  },
  generateFinalFeedback: async () => {
    throw new Error("timeout");
  }
};

describe("final feedback generation", () => {
  it("falls back to deterministic final feedback", async () => {
    const orchestrator = new LlmOrchestrator(failingProvider);
    const feedback = await orchestrator.generateFinalFeedback({
      sessionId: "00000000-0000-0000-0000-000000000001",
      mode: "mixed",
      difficulty: "medium",
      language: "en",
      turns: [{ questionText: "Explain indexing.", answerText: "Indexes speed reads but slow writes.", scoreOverall: 70 }]
    });
    expect(feedback.summary).toContain("Average answer quality");
    expect(feedback.actionPlan.length).toBeGreaterThan(0);
  });
});
