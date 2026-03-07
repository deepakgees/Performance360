# Frontend – Agent context

- **Entry**: `src/App.tsx` – sets up React Query, `AuthProvider`, Router, and route tree. Protected routes use `PrivateRoute`, `ManagerRoute`, or `AdminRoute` with `Layout`.
- **State**: React Query for server state; `AuthContext` for user/auth. Use `useQuery`/`useMutation` for API calls.
- **Styling**: Tailwind CSS. Global styles in `src/index.css`.
- **Structure**: `src/components/` (reusable UI), `src/pages/` (route targets), `src/contexts/`, `src/services/` (API helpers).
- **Conventions**: See root `AGENTS.md` and `.cursor/rules/frontend-react-ts.mdc`. Follow ESLint and hooks rules. Prefer functional components and existing patterns (e.g. `src/components/Layout.tsx`).
