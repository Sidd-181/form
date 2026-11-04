# FormForge

React + Vite + Tailwind frontend (`/`) and Express + MongoDB backend (`/server`). All phases are in this one project.

## Run it
1. Make sure MongoDB is running locally (or have an Atlas URI).
2. Configure the backend once. In Windows PowerShell:

```powershell
Set-Location server
Copy-Item .env.example .env
# Edit .env and set JWT_SECRET to a private random value of at least 32 characters.
npm install
```

3. From the project root, install dependencies and start both the API and frontend together:

```powershell
npm install
npm run dev
```

The app runs on port 5173 and the API on port 4000. Keep this command running while using the app. If MongoDB is unavailable, the API reports the connection error in this terminal.

## What each phase added
| Phase | Where |
|---|---|
| 1-2 Design system, layout, routing, dashboard | `src/components/ui.tsx`, `AppLayout.tsx`, `src/pages/Dashboard.tsx` |
| 3 Templates and form editor | `src/pages/CreateForm.tsx`, `Editor.tsx`, `EditorPanels.tsx`, `src/services/templates.ts`, `fieldTypes.ts` |
| Backend and API connection, auth | `server/`, `src/services/api.ts`, `src/store/index.ts`, `src/pages/Auth.tsx` |
| 4 Preview, share, public form | `Preview.tsx`, `Share.tsx`, `PublicForm.tsx`, `src/components/FormRenderer.tsx` |
| 5 Responses and analytics | `Responses.tsx`, `Analytics.tsx`, `src/services/responses.ts` |
| 6 Landing page and settings | `Landing.tsx`, `Settings.tsx`, `src/services/theme.ts`, `server/src/routes/settings.js` |
