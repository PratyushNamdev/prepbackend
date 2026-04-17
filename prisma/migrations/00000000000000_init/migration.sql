-- Initial PrepOS schema. Generated manually to match src/database/prisma/schema.prisma.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "LanguagePreference" AS ENUM ('en', 'hinglish', 'mixed');
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');
CREATE TYPE "UserStatus" AS ENUM ('active', 'blocked', 'deleted');
CREATE TYPE "InterviewMode" AS ENUM ('dsa', 'core_cs', 'mixed');
CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE "InterviewLanguage" AS ENUM ('en', 'hinglish');
CREATE TYPE "SessionStatus" AS ENUM ('created', 'active', 'waiting_for_candidate', 'evaluating', 'generating_next_question', 'paused', 'completed', 'failed', 'expired');
CREATE TYPE "TurnSpeaker" AS ENUM ('interviewer', 'candidate');
CREATE TYPE "ProviderType" AS ENUM ('llm', 'stt', 'tts');

CREATE TABLE "User" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "languagePreference" "LanguagePreference" NOT NULL DEFAULT 'en',
  "role" "UserRole" NOT NULL DEFAULT 'user',
  "status" "UserStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastLoginAt" TIMESTAMP(3),
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "InterviewSession" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "mode" "InterviewMode" NOT NULL,
  "difficulty" "Difficulty" NOT NULL,
  "language" "InterviewLanguage" NOT NULL,
  "status" "SessionStatus" NOT NULL DEFAULT 'created',
  "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
  "totalQuestionsTarget" INTEGER NOT NULL DEFAULT 5,
  "providerLlm" TEXT NOT NULL,
  "providerStt" TEXT NOT NULL,
  "providerTts" TEXT NOT NULL,
  "overallScore" DECIMAL(5,2),
  "technicalScore" DECIMAL(5,2),
  "communicationScore" DECIMAL(5,2),
  "confidenceScore" DECIMAL(5,2),
  "clarityScore" DECIMAL(5,2),
  "depthScore" DECIMAL(5,2),
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "lastActivityAt" TIMESTAMP(3),
  "sessionSummary" TEXT,
  "promptVersion" TEXT NOT NULL DEFAULT 'v1',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterviewTurn" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "sessionId" UUID NOT NULL,
  "turnIndex" INTEGER NOT NULL,
  "speaker" "TurnSpeaker" NOT NULL,
  "questionText" TEXT,
  "answerText" TEXT,
  "audioUrl" TEXT,
  "transcriptConfidence" DECIMAL(5,4),
  "clientTurnId" TEXT NOT NULL,
  "latencyMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InterviewTurn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TurnEvaluation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "turnId" UUID NOT NULL,
  "sessionId" UUID NOT NULL,
  "scoreOverall" DECIMAL(5,2) NOT NULL,
  "scoreTechnical" DECIMAL(5,2) NOT NULL,
  "scoreCommunication" DECIMAL(5,2) NOT NULL,
  "scoreStructure" DECIMAL(5,2) NOT NULL,
  "scoreConfidence" DECIMAL(5,2) NOT NULL,
  "scoreAccuracy" DECIMAL(5,2),
  "strengths" JSONB NOT NULL,
  "weaknesses" JSONB NOT NULL,
  "followUpRecommended" BOOLEAN NOT NULL,
  "followUpReason" TEXT,
  "improvementTip" TEXT NOT NULL,
  "modelName" TEXT NOT NULL,
  "rawModelOutput" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TurnEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SessionFeedback" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "sessionId" UUID NOT NULL,
  "summary" TEXT NOT NULL,
  "strengths" JSONB NOT NULL,
  "weaknesses" JSONB NOT NULL,
  "actionPlan" JSONB NOT NULL,
  "recommendedTopics" JSONB NOT NULL,
  "nextSessionFocus" TEXT NOT NULL,
  "readinessEstimate" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessionFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "sessionId" UUID,
  "turnId" UUID,
  "providerType" "ProviderType" NOT NULL,
  "providerName" TEXT NOT NULL,
  "requestPayload" JSONB NOT NULL,
  "responsePayload" JSONB,
  "success" BOOLEAN NOT NULL,
  "statusCode" INTEGER,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "latencyMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProviderLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actorUserId" UUID,
  "eventType" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" UUID,
  "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdempotencyRecord" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scope" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "responseHash" TEXT NOT NULL,
  "responseBody" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SessionQuestionBank" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "topic" TEXT NOT NULL,
  "difficulty" "Difficulty" NOT NULL,
  "language" "InterviewLanguage" NOT NULL,
  "questionText" TEXT NOT NULL,
  "followUpQuestions" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SessionQuestionBank_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InterviewSession_userId_createdAt_idx" ON "InterviewSession"("userId", "createdAt");
CREATE INDEX "InterviewSession_status_idx" ON "InterviewSession"("status");
CREATE UNIQUE INDEX "InterviewTurn_sessionId_clientTurnId_key" ON "InterviewTurn"("sessionId", "clientTurnId");
CREATE UNIQUE INDEX "InterviewTurn_sessionId_turnIndex_speaker_key" ON "InterviewTurn"("sessionId", "turnIndex", "speaker");
CREATE INDEX "InterviewTurn_sessionId_createdAt_idx" ON "InterviewTurn"("sessionId", "createdAt");
CREATE UNIQUE INDEX "TurnEvaluation_turnId_key" ON "TurnEvaluation"("turnId");
CREATE INDEX "TurnEvaluation_sessionId_idx" ON "TurnEvaluation"("sessionId");
CREATE UNIQUE INDEX "SessionFeedback_sessionId_key" ON "SessionFeedback"("sessionId");
CREATE INDEX "ProviderLog_sessionId_createdAt_idx" ON "ProviderLog"("sessionId", "createdAt");
CREATE INDEX "ProviderLog_turnId_idx" ON "ProviderLog"("turnId");
CREATE INDEX "AuditEvent_actorUserId_createdAt_idx" ON "AuditEvent"("actorUserId", "createdAt");
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");
CREATE UNIQUE INDEX "IdempotencyRecord_scope_key_key" ON "IdempotencyRecord"("scope", "key");
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");
CREATE INDEX "SessionQuestionBank_topic_difficulty_language_idx" ON "SessionQuestionBank"("topic", "difficulty", "language");

ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterviewTurn" ADD CONSTRAINT "InterviewTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TurnEvaluation" ADD CONSTRAINT "TurnEvaluation_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "InterviewTurn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TurnEvaluation" ADD CONSTRAINT "TurnEvaluation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionFeedback" ADD CONSTRAINT "SessionFeedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderLog" ADD CONSTRAINT "ProviderLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProviderLog" ADD CONSTRAINT "ProviderLog_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "InterviewTurn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
