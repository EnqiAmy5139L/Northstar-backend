# NorthStar·ClearGate

```
frontend/   static site (index.html, styles.css, script.js, config.js) - deploy to Vercel / Firebase Hosting
backend/    Express API (server.js) + Firebase project files + sample resumes
```

## Run locally
1. `cd backend && cp .env.example .env` and set `GEMINI_API_KEY`, then `npm install && npm start` (port 8080).
2. In `frontend/config.js` set `window.NORTHSTAR_API_URL = "http://localhost:8080/api/evaluate"`.
3. Serve `frontend/` (e.g. `npx serve frontend`) and open it.

## Deploy
- Backend: any Node host (Render: build `npm install`, start `npm start`, env `GEMINI_API_KEY`). Then put its URL in `frontend/config.js`.
- Alternative: `backend/functions` is the same endpoint as a Firebase Cloud Function (`firebase deploy --only functions`).
- Frontend: static upload of the `frontend/` folder.

## Notes
- `POST /api/evaluate` takes `{ "prompt": "..." }` and returns `{ "aiResponse": "..." }`.
- Blueprints, profiles and applications are stored in the browser's localStorage (as in the original build); Firebase Auth handles login.
- `sample-resumes/` holds three .txt resumes for testing the upload flow.
