# FormForge

React + Vite + Tailwind frontend (`/`) and Express + MongoDB backend (`/server`), implemented in JavaScript and JSX. All phases are in this one project.

## Run it
1. MongoDB running locally (or an Atlas URI).
2. Backend: `cd server && cp .env.example .env` (set `JWT_SECRET`, 32+ chars) `&& npm install && npm run dev` (port 4000).
3. Frontend: in the project root `npm install && npm run dev` (port 5173, proxies `/api` to the backend).

## Uploads and password resets
Set `UPLOAD_DIR` in the backend environment to a private, persistent directory (the default is `server/uploads`). `MAX_UPLOAD_SIZE_BYTES` configures the global upload cap (default 10 MB); a file field's optional maximum size applies as a stricter per-field cap. The public form supplies this configured limit to the browser, and the backend rejects files over either limit before storage. PNG, JPEG, and PDF files are stored outside the public web root and downloadable only by the form owner. Back up this directory along with the MongoDB database.

Password reset delivery requires SMTP settings in the backend environment: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. Reset links expire after 30 minutes and can be used once. Without SMTP configured, reset requests still return the same privacy-preserving response, but no email can be delivered.

## What each phase added
| Phase | Where |
|---|---|
| 1-2 Design system, layout, routing, dashboard | `src/components/ui.js`, `AppLayout.js`, `src/pages/Dashboard.js` |
| 3 Templates and form editor | `src/pages/CreateForm.js`, `Editor.js`, `EditorPanels.js`, `src/services/templates.js`, `fieldTypes.js` |
| Backend and API connection, auth | `server/`, `src/services/api.js`, `src/store/index.js`, `src/pages/Auth.js` |
| 4 Preview, share, public form | `Preview.js`, `Share.js`, `PublicForm.js`, `src/components/FormRenderer.js` |
| 5 Responses and analytics | `Responses.js`, `Analytics.js`, `src/services/responses.js` |
| 6 Landing page and settings | `Landing.js`, `Settings.js`, `src/services/theme.js`, `server/src/routes/settings.js` |
