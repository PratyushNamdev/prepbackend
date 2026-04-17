import { describe, expect, it } from "vitest";
import { createSessionSchema } from "../src/modules/interviews/sessions/session.schemas.js";

describe("session schemas", () => {
  it("accepts valid session creation input", () => {
    expect(
      createSessionSchema.parse({
        mode: "mixed",
        difficulty: "medium",
        language: "en",
        totalQuestionsTarget: 5
      })
    ).toEqual({
      mode: "mixed",
      difficulty: "medium",
      language: "en",
      totalQuestionsTarget: 5
    });
  });

  it("rejects unsupported modes", () => {
    expect(() => createSessionSchema.parse({ mode: "video", difficulty: "easy", language: "en" })).toThrow();
  });
});
