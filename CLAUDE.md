# CLAUDE.md — Vibe Check

> Senior architect notes for Claude Code working in this repo. Read this before touching code.

## What this app does

Natural-language mood → LLM song picks (Groq + LLaMA 3.3) → Spotify search → embedded players. No user login. Stateless backend.

## Layout

```
vibe-check/
├── backend/                    # FastAPI, Python 3.11+
│   ├── main.py                 # app entrypoint, CORS, dotenv
│   ├── routers/mood.py         # POST /api/mood
│   ├── services/
│   │   ├── groq_service.py     # LLaMA 3.3 via Groq SDK (currently sync!)
│   │   └── spotify_service.py  # Client Credentials, token cache, 3-tier search
│   ├── models/schemas.py       # Pydantic v2 DTOs
│   ├── render.yaml             # Render web service
│   └── requirements.txt
└── frontend/                   # React 18 + Vite, plain JS
    ├── src/
    │   ├── App.jsx
    │   ├── components/{MoodInput,PlaylistView,TrackCard}.jsx
    │   ├── services/{api,spotify}.js   # spotify.js is unused (future OAuth)
    │   └── hooks/useSpotifyAuth.js     # also unused
    └── vercel.json
```

## Local dev

```bash
# Backend
cd backend && python -m venv venv && source venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload                 # http://localhost:8000

# Frontend (separate shell)
cd frontend && npm install && npm run dev # http://localhost:5173
```

`.env` files live at `backend/.env` and `frontend/.env` (gitignored). Templates in `.env.example`.

## Conventions

- **Python**: PEP 8, type annotations on public functions, `black` + `ruff` + `isort`. Use `logging` not `print`. Pydantic v2 for boundary validation. Async I/O for anything touching network.
- **JS/React**: functional components, hooks, no class components. Plain JS today; if types are added, prefer TypeScript over scattered JSDoc. No `console.log` in committed code.
- **Files**: prefer many small modules (<400 lines). Errors are explicit — never swallowed silently.
- **Secrets**: env vars only. Never commit `.env`. `.env.example` documents required keys.

## Required env vars

| Var | Where | Purpose |
|---|---|---|
| `GROQ_API_KEY` | backend | LLaMA 3.3 inference |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | backend | Client Credentials for track search |
| `ALLOWED_ORIGINS` | backend | comma-separated CORS origins |
| `VITE_API_URL` | frontend | backend base URL |

---

## ⚠️ Known issues (fix before production)

Order = priority.

### P0 — correctness / cost / safety

1. **`groq_service.get_song_recommendations` is sync inside an async route.**
   `routers/mood.py` calls it directly from an `async def` handler — it blocks the event loop for the full LLM latency (~1–3s). Under any concurrency this kneecaps throughput.
   **Fix:** use Groq's async client (`AsyncGroq`) and `await` it, or wrap the sync call with `asyncio.to_thread(...)`.
2. **No rate limiting.** Every `POST /api/mood` is a Groq billable token call. A trivial loop from any client drains the API budget.
   **Fix:** `slowapi` (IP + global), e.g. 10/min/IP, 200/min global. Add Turnstile/CAPTCHA on the frontend if abuse appears.
3. **`MoodRequest.mood` and `.count` are unvalidated.** A 10 KB mood string and `count=500` both go to Groq.
   **Fix:** `Field(min_length=1, max_length=500)` on `mood`; `Field(ge=1, le=20)` on `count`.
4. **CORS is `allow_credentials=True` with wildcard methods/headers.** Fine while `ALLOWED_ORIGINS` is explicit, but if someone ever sets it to `*` this becomes a CSRF foothold.
   **Fix:** drop `allow_credentials=True` (no cookies are used), restrict methods to `["POST", "GET", "OPTIONS"]`.
5. **No timeouts on Spotify or Groq calls.** A hung upstream stalls the request indefinitely.
   **Fix:** `httpx.AsyncClient(timeout=httpx.Timeout(8.0, connect=3.0))`. Groq SDK accepts `timeout=` too.
6. **Frontend has no error handling.** `App.jsx` awaits `getMoodRecommendations` without try/catch — on backend 500, status stays `"loading"` forever and the button stays disabled.
   **Fix:** try/catch, surface an `"error"` status with a retry button. Also handle the empty-`tracks` case.

### P1 — performance / hygiene

7. **`httpx.AsyncClient` is recreated per Spotify call.** No connection pooling, no HTTP/2.
   **Fix:** module-level singleton client, closed on FastAPI shutdown via lifespan event.
8. **Spotify token cache lock holds while making the network call.** Concurrent requests serialize token fetches even though they only need to serialize the *cache write*.
   **Fix:** double-checked locking, or only lock around the write.
9. **Healthcheck path is `/docs`.** Works, but loads full Swagger UI. Add a real `/healthz` returning `{"status":"ok"}`.
10. **`detail=f"Groq error: {str(e)}"` leaks raw provider errors to the client.**
    **Fix:** generic message to the client, full error to logs. Configure JSON logs (`python-json-logger`) so Render logs are queryable.
11. **No tests anywhere.** Required floor: pytest on `groq_service` (mock client), `spotify_service` (mock httpx), `mood` router (FastAPI `TestClient`). Frontend: Vitest + React Testing Library on `MoodInput` and `App` error/loading paths. Target 80% per house rules.
12. **`axios` for one POST is overkill.** Native `fetch` works fine. Not urgent.

### P2 — UX / design polish

13. Inline styles everywhere. Works, but every component carries its own spacing/colors. Centralize tokens (`:root { --purple, --surface, --radius … }` already partial) and migrate to CSS modules or a small utility layer.
14. No loading skeleton — the user stares at a disabled button. Add a shimmer/skeleton grid while `status === "loading"`.
15. No accessibility pass: textarea has no `aria-label`, chips are `<button>` (good) but lack visible focus styles, no reduced-motion handling on Spotify iframes.
16. No mobile QA loop. Verify at 320 / 375 / 768.

### Dead code to delete or wire up

- `frontend/src/services/spotify.js` — full PKCE flow, unused.
- `frontend/src/hooks/useSpotifyAuth.js` — unused (verify).

Either land the "Add to My Playlist" feature or delete both. Untracked files (`?? frontend/src/hooks/`, `?? frontend/src/services/spotify.js`) shouldn't sit on `main` indefinitely.

---

## Deployment plan

### Today's setup (works, but bare minimum)

- **Backend → Render** (`backend/render.yaml`, likely free tier).
- **Frontend → Vercel** (`frontend/vercel.json`, SPA rewrites).
- Manual env-var entry in each dashboard.
- No CI, no preview environments, no monitoring.

### Recommended production setup

#### Backend (Render)

1. **Upgrade off free tier** if traffic > demo. Free dynos cold-start ~30s → first request after idle is unusable. Starter (~$7/mo) keeps it warm.
2. Add a real `/healthz` endpoint and point `healthCheckPath` at it.
3. Pin runtime: add `runtime.txt` with `python-3.11.9` (or set `PYTHON_VERSION`). Don't let Render auto-upgrade Python under you.
4. Use `gunicorn` with `uvicorn.workers.UvicornWorker`:
   ```yaml
   startCommand: gunicorn -k uvicorn.workers.UvicornWorker -w 2 --timeout 30 main:app --bind 0.0.0.0:$PORT
   ```
5. Lock dependencies: switch `requirements.txt` to `==` pins or migrate to `uv` / `poetry` with a lockfile. Right now `>=` ranges drift every deploy.
6. Set `LOG_LEVEL`, `ENV=production` env vars. Wire `python-json-logger`.

#### Frontend (Vercel)

1. Add `"engines": { "node": "20.x" }` to `package.json` so Vercel pins Node.
2. SPA fallback is already wired in `vercel.json` — fine.
3. Add `VITE_API_URL` to **all three** Vercel environments (Production, Preview, Development) — preview deploys today hit nothing.

#### Cross-cutting

7. **CI** (one GitHub Actions workflow):
   - backend: `ruff check`, `pytest`, `bandit -r .`
   - frontend: `npm ci`, `npm run build`, eventually `vitest`
   - Block merges on red.
8. **Monitoring**:
   - Sentry (free tier) on both backend and frontend — three lines each, catches the long tail of 500s and JS errors you'll never otherwise see.
   - UptimeRobot or BetterStack hitting `/healthz` every 5 min.
9. **Secrets rotation**: document a quarterly rotation cadence for `GROQ_API_KEY` and `SPOTIFY_CLIENT_SECRET`. Both are revocable in their respective dashboards.
10. **Cost ceiling**: set a Groq usage alert. LLaMA 3.3 70B at scale isn't free.

### Architectural changes worth doing soon

- **Response caching**: identical mood strings within a short window should return cached results. Even a 5-minute in-memory LRU on `(mood, count)` cuts Groq spend on demo traffic. Beyond one instance, use Upstash Redis (free tier, HTTP API).
- **Streaming**: `POST /api/mood` blocks until *all* Spotify enrichments resolve (`asyncio.gather`). Switching to SSE or chunked JSON lets the UI render songs as they land — feels 3× faster even if total time is the same. README already flags this.
- **Split LLM and enrichment**: `POST /api/mood/recommend` returns just the LLM output; `POST /api/spotify/enrich` resolves tracks. Lets the frontend show titles immediately and progressively populate players. Also makes each endpoint independently cacheable.
- **If "Add to My Playlist" lands**: the existing PKCE code in `frontend/src/services/spotify.js` is the right approach (PKCE in the browser, no client secret needed). But: the redirect URI must be HTTPS in production, and Spotify requires the redirect URI to be registered ahead of time per environment (prod + preview). Plan that before turning it on.

## Working with this codebase (for Claude)

- **Before changes touching `services/`**: re-read `services/groq_service.py` and `services/spotify_service.py`. They're small. Don't infer behavior from the README.
- **When adding a backend endpoint**: register in `main.py`, add Pydantic schemas in `models/schemas.py`, put logic in `services/`, keep routers thin.
- **When adding a frontend component**: drop in `src/components/`, one component per file, use existing CSS variables from `index.css` instead of new inline colors.
- **Tests are not optional** for new code per house rules. Add `pytest` + httpx-mock for backend, `vitest` + RTL for frontend on the first PR that introduces logic.
- **Don't add abstractions ahead of need.** This is a 3-component frontend and 2-service backend. No DI container, no repository pattern, no state-management library until there's actual state to manage.

## Quick verify checklist before a commit

- [ ] Backend: `uvicorn main:app --reload` starts cleanly
- [ ] Frontend: `npm run dev` boots, mood submit returns songs
- [ ] No `.env` staged (`git status` clean)
- [ ] No `print` / `console.log` left in
- [ ] `ruff check backend/` clean
- [ ] If touching the LLM prompt: manually verify JSON still parses with 2–3 sample moods
