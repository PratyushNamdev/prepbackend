export const now = (): Date => new Date();

export const addSeconds = (date: Date, seconds: number): Date => new Date(date.getTime() + seconds * 1000);

export const durationMs = (startedAt: number): number => Date.now() - startedAt;
