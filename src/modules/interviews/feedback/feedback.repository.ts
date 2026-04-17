import type { Prisma } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";

export class FeedbackRepository {
  findBySessionId(sessionId: string) {
    return prisma.sessionFeedback.findUnique({ where: { sessionId } });
  }

  upsert(sessionId: string, data: Omit<Prisma.SessionFeedbackUncheckedCreateInput, "sessionId">) {
    return prisma.sessionFeedback.upsert({
      where: { sessionId },
      create: { sessionId, ...data },
      update: data
    });
  }
}

export const feedbackRepository = new FeedbackRepository();
