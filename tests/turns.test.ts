import { describe, expect, it } from "vitest";
import { submitTurnSchema } from "../src/modules/interviews/turns/turn.schemas.js";

describe("turn validation", () => {
  it("requires answer text and clientTurnId", () => {
    const parsed = submitTurnSchema.parse({
      answerText: "A stack can be used to track opening brackets and match closing brackets.",
      clientTurnId: "client-1",
      transcriptConfidence: 0.91
    });
    expect(parsed.clientTurnId).toBe("client-1");
  });

  it("rejects invalid transcript confidence", () => {
    expect(() =>
      submitTurnSchema.parse({
        answerText: "answer",
        clientTurnId: "client-1",
        transcriptConfidence: 2
      })
    ).toThrow();
  });
});
