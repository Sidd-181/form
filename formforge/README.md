# FormForge

React + Vite + Tailwind frontend (`/`) and Express + MongoDB backend (`/server`). All phases are in this one project.

## Run it
1. MongoDB running locally (or an Atlas URI).
2. Backend: `cd server && cp .env.example .env` (set `JWT_SECRET`, 32+ chars) `&& npm install && npm run dev` (port 4000).
3. Frontend: in the project root `npm install && npm run dev` (port 5173, proxies `/api` to the backend).

## What each phase added
| Phase | Where |
|---|---|
| 1-2 Design system, layout, routing, dashboard | `src/components/ui.tsx`, `AppLayout.tsx`, `src/pages/Dashboard.tsx` |
| 3 Templates and form editor | `src/pages/CreateForm.tsx`, `Editor.tsx`, `EditorPanels.tsx`, `src/services/templates.ts`, `fieldTypes.ts` |
| Backend and API connection, auth | `server/`, `src/services/api.ts`, `src/store/index.ts`, `src/pages/Auth.tsx` |
| 4 Preview, share, public form | `Preview.tsx`, `Share.tsx`, `PublicForm.tsx`, `src/components/FormRenderer.tsx` |
| 5 Responses and analytics | `Responses.tsx`, `Analytics.tsx`, `src/services/responses.ts` |
| 6 Landing page and settings | `Landing.tsx`, `Settings.tsx`, `src/services/theme.ts`, `server/src/routes/settings.ts` |
