import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  languagePreference: z.enum(["en", "hinglish", "mixed"])
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20)
});

export const safeUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  languagePreference: z.enum(["en", "hinglish", "mixed"]),
  role: z.enum(["user", "admin"]),
  status: z.enum(["active", "blocked", "deleted"]),
  createdAt: z.string(),
  lastLoginAt: z.string().nullable()
});

export const authResponseSchema = z.object({
  user: safeUserSchema,
  accessToken: z.string(),
  refreshToken: z.string()
});

export const meResponseSchema = z.object({
  user: safeUserSchema
});

export const logoutResponseSchema = z.object({
  success: z.literal(true)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
