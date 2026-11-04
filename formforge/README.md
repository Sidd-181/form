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
| 1-2 Design system, layout, routing, dashboard | `src/components/ui.jsx`, `AppLayout.jsx`, `src/pages/Dashboard.jsx` |
| 3 Templates and form editor | `src/pages/CreateForm.jsx`, `Editor.jsx`, `EditorPanels.jsx`, `src/services/templates.js`, `fieldTypes.js` |
| Backend and API connection, auth | `server/`, `src/services/api.js`, `src/store/index.js`, `src/pages/Auth.jsx` |
| 4 Preview, share, public form | `Preview.jsx`, `Share.jsx`, `PublicForm.jsx`, `src/components/FormRenderer.jsx` |
| 5 Responses and analytics | `Responses.jsx`, `Analytics.jsx`, `src/services/responses.js` |
| 6 Landing page and settings | `Landing.jsx`, `Settings.jsx`, `src/services/theme.js`, `server/src/routes/settings.js` |
