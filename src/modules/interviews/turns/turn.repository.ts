import type { Prisma } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";

export class TurnRepository {
  create(data: Prisma.InterviewTurnUncheckedCreateInput) {
    return prisma.interviewTurn.create({ data });
  }

  createEvaluation(data: Prisma.TurnEvaluationUncheckedCreateInput) {
    return prisma.turnEvaluation.create({ data });
  }

  findByClientTurnId(sessionId: string, clientTurnId: string) {
    return prisma.interviewTurn.findUnique({
      where: { sessionId_clientTurnId: { sessionId, clientTurnId } },
      include: { evaluation: true }
    });
  }
}

export const turnRepository = new TurnRepository();
