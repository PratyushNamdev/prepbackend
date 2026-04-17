import type { Prisma, SessionStatus } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";

export class SessionRepository {
  create(data: Prisma.InterviewSessionUncheckedCreateInput) {
    return prisma.interviewSession.create({ data });
  }

  findOwned(sessionId: string, userId: string) {
    return prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        turns: { orderBy: [{ turnIndex: "asc" }, { createdAt: "asc" }] },
        evaluations: true,
        feedback: true
      }
    });
  }

  listOwned(userId: string) {
    return prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  updateStatus(sessionId: string, status: SessionStatus, data: Partial<Prisma.InterviewSessionUncheckedUpdateInput> = {}) {
    return prisma.interviewSession.update({
      where: { id: sessionId },
      data: { ...data, status, lastActivityAt: new Date() }
    });
  }

  updateScores(sessionId: string, data: Prisma.InterviewSessionUncheckedUpdateInput) {
    return prisma.interviewSession.update({
      where: { id: sessionId },
      data
    });
  }
}

export const sessionRepository = new SessionRepository();
