import type { User } from "@prisma/client";
import { errors } from "../../common/errors/AppError.js";
import { userRepository } from "./user.repository.js";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  languagePreference: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
};

export const toSafeUser = (user: User): SafeUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  languagePreference: user.languagePreference,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt.toISOString(),
  lastLoginAt: user.lastLoginAt?.toISOString() ?? null
});

export class UserService {
  async getActiveUser(id: string): Promise<User> {
    const user = await userRepository.findById(id);
    if (!user || user.status !== "active") {
      throw errors.unauthorized("User is not active");
    }
    return user;
  }
}

export const userService = new UserService();
