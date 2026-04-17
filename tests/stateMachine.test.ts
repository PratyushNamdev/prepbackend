import { describe, expect, it } from "vitest";
import { assertTransition, isFinalSessionStatus, transitionSession } from "../src/modules/interviews/sessions/session.stateMachine.js";

describe("session state machine", () => {
  it("allows expected transitions", () => {
    expect(transitionSession("created", "active")).toBe("active");
    expect(transitionSession("active", "waiting_for_candidate")).toBe("waiting_for_candidate");
    expect(transitionSession("waiting_for_candidate", "evaluating")).toBe("evaluating");
    expect(transitionSession("evaluating", "generating_next_question")).toBe("generating_next_question");
    expect(transitionSession("generating_next_question", "waiting_for_candidate")).toBe("waiting_for_candidate");
    expect(transitionSession("paused", "active")).toBe("active");
  });

  it("rejects invalid transitions", () => {
    expect(() => assertTransition("created", "evaluating")).toThrow("Invalid session transition");
    expect(() => assertTransition("completed", "active")).toThrow("Invalid session transition");
  });

  it("detects final states", () => {
    expect(isFinalSessionStatus("completed")).toBe(true);
    expect(isFinalSessionStatus("failed")).toBe(true);
    expect(isFinalSessionStatus("waiting_for_candidate")).toBe(false);
  });
});
