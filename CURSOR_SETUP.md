# Cursor IDE Configuration for Performance360

## Overview

This guide helps you configure Cursor IDE to generate code that follows project conventions, ESLint rules, and passes strict builds. The project uses **AGENTS.md** and **`.cursor/rules/`** to give the AI consistent context.

## Configuration Files

### 1. AGENTS.md (project root)

Single briefing file for AI agents: stack, project structure, commands (build/test), conventions, and references. Kept under ~150 lines. Cursor applies this when working in the repo.

**Location**: `AGENTS.md` (root directory)

### 2. Project rules (`.cursor/rules/`)

Scoped rule files that tell Cursor how to generate and edit code:

| Rule file | When it applies | Purpose |
|-----------|------------------|---------|
| `project-global.mdc` | Always | TypeScript strict, build-before-commit, follow existing patterns |
| `frontend-react-ts.mdc` | Files under `frontend/**/*.ts`, `frontend/**/*.tsx` | ESLint, React hooks, useCallback/useMemo, types |
| `backend-express.mdc` | Files under `backend/**/*.ts` | Logging, Prisma, middleware, utils |
| `api-routes.mdc` | Files under `backend/src/routes/**/*.ts` | REST, validation, auth, error responses |

**Location**: `.cursor/rules/` (root directory). Rule types: *Always Apply* (project-global) and *Apply to Specific Files* (others). For full agent context, ensure AGENTS.md and the relevant rule files are in place.

### 3. ESLint configuration

**Location**: `frontend/.eslintrc.json`

Already configured with strict unused variable checking, React hooks exhaustive deps, and TypeScript rules.

### 4. TypeScript configuration

**Location**: `frontend/tsconfig.json`

Strict mode and type checking enabled.

## Cursor Settings

### Enable ESLint integration

1. Open Cursor Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "ESLint"
3. Enable:
   - **ESLint: Enable**
   - **ESLint: Validate**
   - **Editor: Code Actions On Save** → "source.fixAll.eslint"

### Enable TypeScript checking

1. In Cursor Settings, search for "TypeScript"
2. Enable **TypeScript: Validate** and **TypeScript: Check JS**

### Code actions on save

In Settings, add to `settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  }
}
```

## Using Cursor AI

### When asking Cursor to generate code

1. **Be specific**: Mention ESLint or project rules (e.g. "follow rules in `.cursor/rules/`" or "use useCallback for handlers").
2. **Reference context**: Point to AGENTS.md or a rule (e.g. "follow frontend rules" when editing React/TS files).
3. **Request validation**: Ask Cursor to ensure code passes ESLint and `npm run build`.

### Example prompts

**Good:**
- "Create a React component that follows the frontend rules in `.cursor/rules/` and uses useCallback for event handlers."
- "Add an API route that validates input with express-validator and uses the auth middleware; follow patterns in `backend/src/routes/auth.ts`."

**Less effective:**
- "Create a component" (no reference to rules or conventions)

## Verification

### After code generation

1. Check ESLint in the editor (red underlines).
2. Run `npm run build` in both `frontend/` and `backend/`.
3. Ask Cursor to fix any reported errors.

### Quick check commands

```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && npm run build
```

## Cursor / VS Code settings file

Create or update `.vscode/settings.json`:

```json
{
  "eslint.enable": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.formatOnSave": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Tips for better code generation

1. **Context**: Open relevant files before asking Cursor to generate code so it can follow existing patterns.
2. **Explicit**: Mention "use useCallback", "include dependencies", or "follow backend rules".
3. **Iterate**: Generate → run build → ask Cursor to fix errors.
4. **Examples**: Point to similar files (e.g. `frontend/src/components/Layout.tsx`, `backend/src/routes/auth.ts`).

## Troubleshooting

### Cursor doesn’t follow project rules

1. **Check rules**: Ensure `AGENTS.md` is at repo root and `.cursor/rules/` contains the `.mdc` files.
2. **Reload Cursor**: Reload the window so new or updated rules are picked up (e.g. Command Palette → "Developer: Reload Window").
3. **Be explicit**: In chat, reference "AGENTS.md" or ".cursor/rules" or the specific rule (e.g. "follow frontend-react-ts rules").

### ESLint not working

1. Install the ESLint extension in Cursor.
2. Run `npm install` in `frontend/`.
3. Verify `frontend/.eslintrc.json` exists.

### TypeScript errors

1. Check `frontend/tsconfig.json` and `backend` tsconfig if used.
2. Restart TS server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server".

## Best practices

1. **Review generated code**: Don’t accept AI-generated code without review; the developer is responsible for accepted changes.
2. **Run build before committing**: Use `npm run build` in both frontend and backend.
3. **Fix errors early**: Don’t let errors accumulate.
4. **Use the linter**: Rely on ESLint and project rules for consistency.
5. **Follow patterns**: Match existing code style and structure in the project.

## Summary

- **AGENTS.md** at project root for stack, commands, and conventions.
- **`.cursor/rules/`** with project-global, frontend, backend, and API rules (file-scoped where appropriate).
- ESLint and TypeScript remain strict; build scripts use CI mode where applicable.
- Cursor uses these rules and AGENTS.md when generating and editing code.

**Remember**: Run `npm run build` in both frontend and backend before committing.
