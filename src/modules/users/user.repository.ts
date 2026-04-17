import type { LanguagePreference, Prisma, User } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export class UserRepository {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    languagePreference: LanguagePreference;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase()
      }
    });
  }

  updateLastLogin(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() }
    });
  }

  createAuditEvent(data: Prisma.AuditEventUncheckedCreateInput) {
    return prisma.auditEvent.create({ data });
  }
}

export const userRepository = new UserRepository();
