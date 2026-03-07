# Backend – Agent context

- **Entry**: `src/index.ts` – Express app, helmet, CORS, body parser, env validation, then middleware (requestLogger, sessionTracking, rate limit, routes, errorHandler). Server listens on `PORT` from env.
- **Routes**: Mounted under `/api/*`. Route modules live in `src/routes/`; each exports a router. See `src/routes/auth.ts` for pattern (validation, logger, sanitizeForLogging, Prisma, responses).
- **Middleware**: `src/middleware/` – auth (`authenticateToken`, `AuthRequest`), errorHandler, requestLogger, rateLimiter, sessionTracking. Use `logger` from `src/utils/logger`; do not use `console.log` in request paths.
- **Database**: Prisma; schema and migrations in `prisma/`. Env vars and `.env` – copy from `env.example`.
- **Conventions**: See root `AGENTS.md` and `.cursor/rules/` (backend-express.mdc, api-routes.mdc).
