# Performance360 – Agent Instructions

Briefing for AI coding agents. For full project overview see [README.md](README.md).

## Stack

- **Frontend**: React, TypeScript, Tailwind CSS, React Query (TanStack Query), React Router
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT; role-based access (Admin, Manager, Employee)

## Structure

- `frontend/src/` – components, pages, contexts, services
- `backend/src/` – routes, middleware, utils; entry `index.ts`
- `backend/prisma/` – schema and migrations
- `docs/` – security, features, deployment
- `tests/playwright-tests/` – E2E tests
- `tests/backend-tests/` – backend unit/integration tests
- `tests/security-tests/` – security test suite
- `scripts/` – database and development scripts

## Commands

**Backend** (from repo root):
- `cd backend && npm run dev` – dev server
- `cd backend && npm run build` – production build
- `cd backend && npm run db:push` – apply Prisma schema
- `cd backend && npm run db:seed` – seed database

**Frontend** (from repo root):
- `cd frontend && npm run start` – dev server
- `cd frontend && npm run build` – production build (strict; warnings as errors)

**Tests**:
- E2E: `cd tests/playwright-tests && npm test`
- Backend: `cd tests/backend-tests && node test-runner.js`
- Security: run suite from `tests/security-tests/`

## Conventions

- **TypeScript everywhere**: strict types; no `any` unless necessary; no `@ts-ignore`/`@ts-expect-error` without a short comment.
- **Frontend**: Follow ESLint in `frontend/.eslintrc.json` and rules in `.cursor/rules/` (hooks, useCallback/useMemo, deps, functional components).
- **Backend**: Use `logger` from `backend/src/utils/logger` (not `console.log` in request paths). Use Prisma for DB. Use express-validator where validation exists. Env validated via `utils/envValidation`; sanitize logs with `utils/sanitizeLogs` where relevant.
- **Quality**: Run `npm run build` in both frontend and backend before committing. All code (including AI-generated) should be reviewed; the developer is responsible for accepted changes.

## Architecture (high level)

```
Frontend (React) --> Backend (Express) --> Prisma --> PostgreSQL
       |                     |
       |                     +-- JWT auth, middleware (auth, rateLimit, errorHandler, requestLogger)
       +-- React Query, AuthContext, role-based routes
```

## References

- **Detailed rules**: `.cursor/rules/` (project-global, frontend-react-ts, backend-express, api-routes).
- **Security / deployment**: `docs/`, `backend/SECURITY.md`, `backend/DEPLOYMENT.md`.
- **API**: `backend/API_DOCUMENTATION.md`. **Database**: `backend/DATABASE_SCHEMA.md`.
