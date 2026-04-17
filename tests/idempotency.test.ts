import { describe, expect, it } from "vitest";
import { responseHash } from "../src/common/utils/idempotency.js";

describe("idempotency utilities", () => {
  it("creates stable response hashes", () => {
    const payload = { turnId: "t1", score: 72 };
    expect(responseHash(payload)).toBe(responseHash(payload));
    expect(responseHash(payload)).not.toBe(responseHash({ turnId: "t1", score: 73 }));
  });
});
