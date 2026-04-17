# PrepOS Backend

Production-oriented Node.js backend for PrepOS v1 voice interview sessions.

## Stack

- Node.js LTS, Express, TypeScript
- PostgreSQL with Prisma
- Redis for fast idempotency and token deny-list checks
- Zod request and response validation
- JWT access and refresh tokens
- Pino structured logging

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Start PostgreSQL and Redis, then run Prisma:

```bash
npm run prisma:generate
npm run prisma:dev
npm run seed
```

4. Start the API:

```bash
npm run dev
```

The API runs under `/api/v1`.

## Scripts

- `npm run dev` starts the TypeScript dev server.
- `npm run build` compiles TypeScript.
- `npm test` runs Vitest tests.
- `npm run prisma:dev` creates/applies a local migration.
- `npm run prisma:migrate` applies migrations in production.
- `npm run seed` inserts fallback questions and a sample admin.

Sample admin:

- Email: `admin@prepos.local`
- Password: `Admin@12345`

## Routes

Auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Interview sessions:

- `POST /api/v1/interviews/sessions`
- `GET /api/v1/interviews/sessions`
- `GET /api/v1/interviews/sessions/:id`
- `POST /api/v1/interviews/sessions/:id/start`
- `POST /api/v1/interviews/sessions/:id/pause`
- `POST /api/v1/interviews/sessions/:id/resume`
- `POST /api/v1/interviews/sessions/:id/complete`
- `GET /api/v1/interviews/sessions/:id/transcript`
- `GET /api/v1/interviews/sessions/:id/feedback`
- `GET /api/v1/interviews/sessions/:id/progress`
- `POST /api/v1/interviews/sessions/:id/turns`

Admin:

- `GET /api/v1/admin/health`
- `GET /api/v1/admin/providers`
- `GET /api/v1/admin/sessions/:id/debug`

## Fallback Behavior

- LLM calls go through `LlmProvider` and `LlmOrchestrator`; business logic does not call Groq directly.
- Groq calls use JSON response format, a strict timeout, one retry, provider logging, and Zod validation.
- If the provider times out, fails, or returns malformed output twice, the deterministic fallback provider evaluates answers and selects a question from `SessionQuestionBank`.
- STT v1 accepts browser-provided transcript text. TTS v1 returns text only and lets the browser speak it.
- Candidate turn submissions are idempotent by `clientTurnId` scoped to the session, cached in Redis and persisted in PostgreSQL.

## Production Notes

- Do not expose `GROQ_API_KEY` or JWT secrets to clients.
- Use strong distinct JWT secrets in production.
- Run behind HTTPS and a trusted reverse proxy.
- Use managed PostgreSQL and Redis with backups and connection limits.
- Admin routes require a JWT for a user with role `admin`.
