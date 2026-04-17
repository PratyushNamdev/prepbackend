export const SESSION_DEFAULTS = {
  totalQuestionsTarget: 5,
  minQuestions: 1,
  maxQuestions: 10,
  promptVersion: "v1",
  providerStt: "browser-transcript",
  providerTts: "browser-tts"
} as const;

export const ACTIVE_SESSION_STATES = [
  "active",
  "waiting_for_candidate",
  "evaluating",
  "generating_next_question"
] as const;

export const FINAL_SESSION_STATES = ["completed", "failed", "expired"] as const;
