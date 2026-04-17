import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { User } from "@prisma/client";
import { env } from "../../config/env.js";
import { redis } from "../../config/redis.js";
import { errors } from "../../common/errors/AppError.js";
import { addSeconds } from "../../common/utils/time.js";
import { logger } from "../../observability/logger.js";
import { toSafeUser } from "../users/user.service.js";
import { userRepository } from "../users/user.repository.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

type JwtPayload = {
  sub: string;
  role: string;
  tokenType: "access" | "refresh";
};

const parseTtlSeconds = (value: string): number => {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 900;
  const amount = Number(match[1]);
  const unit = match[2];
  if (unit === "s") return amount;
  if (unit === "m") return amount * 60;
  if (unit === "h") return amount * 3600;
  return amount * 86400;
};

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw errors.conflict("Email is already registered");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      languagePreference: input.languagePreference
    });

    await userRepository.createAuditEvent({
      actorUserId: user.id,
      eventType: "auth.registered",
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email }
    });

    return this.issueAuthResponse(user);
  }

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || user.status !== "active") throw errors.unauthorized("Invalid email or password");

    const matches = await bcrypt.compare(input.password, user.passwordHash);
    if (!matches) throw errors.unauthorized("Invalid email or password");

    const updatedUser = await userRepository.updateLastLogin(user.id);
    await userRepository.createAuditEvent({
      actorUserId: user.id,
      eventType: "auth.login",
      entityType: "User",
      entityId: user.id,
      metadata: {}
    });

    return this.issueAuthResponse(updatedUser);
  }

  async refresh(refreshToken: string) {
    const payload = this.verifyToken(refreshToken, "refresh");
    const revoked = await redis.get(this.refreshDenyKey(refreshToken));
    if (revoked) throw errors.unauthorized("Refresh token has been revoked");

    const user = await userRepository.findById(payload.sub);
    if (!user || user.status !== "active") throw errors.unauthorized("User is not active");

    return this.issueAuthResponse(user);
  }

  async logout(refreshToken: string) {
    const ttl = parseTtlSeconds(env.JWT_REFRESH_EXPIRES_IN);
    await redis.set(this.refreshDenyKey(refreshToken), "1", "EX", ttl);
    return { success: true as const };
  }

  verifyToken(token: string, tokenType: "access" | "refresh"): JwtPayload {
    try {
      const secret = tokenType === "access" ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;
      const decoded = jwt.verify(token, secret) as JwtPayload;
      if (decoded.tokenType !== tokenType) throw errors.unauthorized("Invalid token type");
      return decoded;
    } catch (error) {
      logger.debug({ err: error }, "jwt_verify_failed");
      throw errors.unauthorized("Invalid or expired token");
    }
  }

  private issueAuthResponse(user: User) {
    const payload = { sub: user.id, role: user.role };
    const accessToken = jwt.sign(
      { ...payload, tokenType: "access" },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as SignOptions
    );
    const refreshToken = jwt.sign(
      { ...payload, tokenType: "refresh" },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions
    );

    return {
      user: toSafeUser(user),
      accessToken,
      refreshToken
    };
  }

  refreshExpiryDate(): Date {
    return addSeconds(new Date(), parseTtlSeconds(env.JWT_REFRESH_EXPIRES_IN));
  }

  private refreshDenyKey(token: string): string {
    return `auth:refresh:deny:${token}`;
  }
}

export const authService = new AuthService();
