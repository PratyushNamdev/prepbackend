import type { SessionStatus } from "@prisma/client";
import { ACTIVE_SESSION_STATES, FINAL_SESSION_STATES } from "../../../common/constants/interview.js";
import { errors } from "../../../common/errors/AppError.js";

const allowedTransitions: Record<SessionStatus, SessionStatus[]> = {
  created: ["active", "completed", "failed"],
  active: ["waiting_for_candidate", "paused", "completed", "failed", "expired"],
  waiting_for_candidate: ["evaluating", "paused", "completed", "failed"],
  evaluating: ["generating_next_question", "paused", "completed", "failed"],
  generating_next_question: ["waiting_for_candidate", "paused", "completed", "failed"],
  paused: ["active", "completed", "failed", "expired"],
  completed: [],
  failed: [],
  expired: []
};

export const isFinalSessionStatus = (status: SessionStatus): boolean =>
  (FINAL_SESSION_STATES as readonly string[]).includes(status);

export const isActiveSessionStatus = (status: SessionStatus): boolean =>
  (ACTIVE_SESSION_STATES as readonly string[]).includes(status);

export const assertTransition = (from: SessionStatus, to: SessionStatus): void => {
  if (from === to) return;
  if (!allowedTransitions[from].includes(to)) {
    throw errors.conflict(`Invalid session transition from ${from} to ${to}`);
  }
};

export const transitionSession = (from: SessionStatus, to: SessionStatus): SessionStatus => {
  assertTransition(from, to);
  return to;
};
