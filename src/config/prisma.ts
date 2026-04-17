import { PrismaClient } from "@prisma/client";
import { isTest } from "./env.js";

export const prisma = new PrismaClient({
  log: isTest ? [] : ["error", "warn"]
});
