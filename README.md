# Vibe Check

AI-powered mood-to-playlist curator. Describe your vibe in plain English, and Vibe Check uses LLaMA 3.3 (via Groq) to recommend songs, then searches Spotify to serve up embedded players — all in seconds.

## Features

- **Mood Analysis** — Natural language mood input with preset chips (Late Night Drive, Heartbreak, Hype, Chill)
- **AI Song Recommendations** — LLaMA 3.3 70B via Groq API generates curated songs with reasons
- **Spotify Integration** — Backend searches Spotify and returns embedded players (no login required)
- **Multi-language Support** — 3-tier fallback search handles Tamil, Hindi, and other non-English tracks
- **Fast** — Parallel async Spotify enrichment for all songs simultaneously

## Architecture

```
frontend (React + Vite)          backend (FastAPI)
        |                                |
   MoodInput.jsx --POST /api/mood--> mood.py router
   PlaylistView.jsx                      |
   TrackCard.jsx      <-- MoodResponse --+
        |                                +-- groq_service.py  (LLaMA 3.3)
   Spotify embeds                        +-- spotify_service.py (Client Credentials)
```

**Tech Stack:**
- Backend: FastAPI, Groq SDK, httpx, Pydantic v2, python-dotenv
- Frontend: React 18, Vite, Axios
- AI: LLaMA 3.3 70B via Groq API
- Music: Spotify Web API (Client Credentials — no user login needed)

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Groq API key — https://console.groq.com
- Spotify Developer app (Client ID + Secret) — https://developer.spotify.com/dashboard

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` (copy from `.env.example`):

```env
GROQ_API_KEY=your_groq_api_key_here
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
ALLOWED_ORIGINS=http://localhost:5173
```

Start the server:

```bash
uvicorn main:app --reload
```

API runs at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` (copy from `.env.example`):

```env
VITE_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

App runs at `http://localhost:5173`.

## Deployment

### Backend — Render

1. Push this repo to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your repo, set **Root Directory** to `backend`
4. Render picks up `render.yaml` automatically — click Deploy
5. Set environment variables in Render dashboard:
   - `GROQ_API_KEY`
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `ALLOWED_ORIGINS` → your Vercel frontend URL (e.g. `https://vibe-check.vercel.app`)

### Frontend — Vercel

1. Go to https://vercel.com → New Project → import this repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `VITE_API_URL` → your Render backend URL (e.g. `https://vibe-check-api.onrender.com`)
4. Deploy

## API Reference

### `POST /api/mood`

**Request body:**
```json
{ "mood": "late night drive with windows down" }
```

**Response:**
```json
{
  "vibe_summary": "...",
  "songs": [
    {
      "title": "Blinding Lights",
      "artist": "The Weeknd",
      "reason": "...",
      "spotify": {
        "id": "0VjIjW4GlUZAMYd2vXMi3b",
        "name": "Blinding Lights",
        "artist": "The Weeknd",
        "album_art": "https://...",
        "preview_url": null,
        "external_url": "https://open.spotify.com/track/..."
      }
    }
  ]
}
```

## Project Structure

```
vibe-check/
├── backend/
│   ├── main.py                  # FastAPI app, CORS config
│   ├── requirements.txt
│   ├── render.yaml              # Render deployment config
│   ├── .env.example
│   ├── models/
│   │   └── schemas.py           # Pydantic models
│   ├── routers/
│   │   └── mood.py              # POST /api/mood
│   └── services/
│       ├── groq_service.py      # LLaMA via Groq
│       └── spotify_service.py   # Spotify Client Credentials
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json              # Vercel deployment config
│   ├── .env.example
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       │   ├── MoodInput.jsx    # Mood textarea + preset chips
│       │   ├── PlaylistView.jsx # Song grid
│       │   └── TrackCard.jsx    # Album art + Spotify embed
│       └── services/
│           └── api.js           # POST /api/mood
├── .gitignore
└── README.md
```

## Future Improvements

- **Spotify OAuth** — "Add to My Playlist" button using user auth flow (requires HTTPS and a registered redirect URI)
- **User Accounts** — Save favourite playlists and track listening history
- **Mood History** — Remember past vibes, spot patterns over time
- **Genre Filters** — Constrain recommendations by genre (Tamil only, 90s only, etc.)
- **Expanded Music Sources** — YouTube Music, Apple Music, or Deezer as fallback when Spotify misses a track
- **Voice Input** — Speak your mood instead of typing
- **Share Cards** — Generate a shareable image card of the current vibe playlist
- **Real-time Streaming** — Stream song results as they resolve instead of waiting for all parallel requests
- **Mobile PWA** — Installable app with offline playlist caching
- **Song Preview Audio** — 30s in-page preview (Spotify deprecated preview URLs for most tracks in late 2024, needs a workaround or alternative source)

## Known Limitations

- Spotify deprecated 30-second preview URLs for most tracks in late 2024. The `preview_url` field will be `null` for affected tracks — embedded players still work.
- Tamil and other non-English song searches use a 3-tier fallback query strategy for better match rates, but some very regional tracks may still be missing on Spotify.

## License

MIT