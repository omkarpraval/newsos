
```md
# NewsOS

#Try it Now: https://newsos-4dl6.onrender.com

AI-native newsroom platform built with **React + TypeScript + Vite** (frontend) and **Express + PostgreSQL** (backend), focused on personalized news intelligence, multi-angle analysis, vernacular adaptation, and AI-assisted briefing/video workflows.

## Highlights

- Persona-based experience (`trader`, `founder`, `learner`)
- Real-time news ingestion (NewsAPI with GNews fallback)
- AI briefing generation with structured outputs
- Story Arc analysis (timeline, players, risk/catalyst signals)
- Vernacular translation + glossary generation
- Charcha mode with dual AI voices (Riya & Arjun)
- Video workflow support (script + Veo endpoint path)
- JWT auth, profile preferences, and saved briefings

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Zustand, TanStack Query, Tailwind
- **Backend:** Node.js, Express, PostgreSQL (`pg`)
- **AI/Integrations:** Groq, NewsAPI, GNews, Yahoo Finance, Google GenAI, optional ElevenLabs
- **Tooling:** ESLint, PostCSS, TypeScript build mode

## Project Structure

```txt
newsos/
  src/                  # React frontend (pages, components, stores, services)
  server/               # Express API server
  api/                  # Serverless-style handlers (deployment alternative)
  public/               # Static assets (Lottie etc.)
  package.json
  vite.config.ts
```

## Core Features

### 1) Personalized News Intelligence
Tailors framing, depth, and relevance based on persona profile and user preferences.

### 2) Multi-Source News Engine
Fetches headlines/search from NewsAPI, automatically falls back to GNews when needed.

### 3) AI Briefing Studio
Generates structured briefings with facts, players, opposing views, impact, and watch-next signals.

### 4) Arc Tracker
Builds full story arcs with sentiment evolution, risk factors, catalysts, and data-backed predictions.

### 5) Vernacular Pipeline
Translates and culturally adapts stories into Indian languages with glossary support.

### 6) Charcha (Debate Mode)
Interactive dual-agent conversation experience:
- **Riya**: energetic analyst
- **Arjun**: devil’s advocate journalist
  <img width="1918" height="968" alt="image" src="https://github.com/user-attachments/assets/3474c431-60f1-46cb-8131-dde5146f63cc" />


### 7) Video Studio
Creates AI-friendly video script pipelines and supports Veo render endpoint integration.

## API Overview (Express)

- `POST /api/groq`
- `GET /api/news`
- `GET /api/vernacular/news`
- `POST /api/vernacular/translate`
- `POST /api/vernacular/glossary`
- `GET /api/arc/articles`
- `GET /api/arc/market-data`
- `POST /api/arc/custom-chart`
- `POST /api/arc/full-analysis`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/profile`
- `GET /api/briefings`
- `POST /api/briefings`
- `POST /api/video/veo`

## Local Development

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL (optional but recommended for auth/profile/briefings persistence)

### Install
```bash
npm install
```

### Environment
Create `.env.local` (or `.env`) with required keys:

```env
API_PORT=3001
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_postgres_url
GROQ_API_KEY=your_groq_key
NEWSAPI_KEY=your_newsapi_key
GNEWS_API_KEY=your_gnews_key
GOOGLE_API_KEY=your_google_ai_key
VITE_ELEVENLABS_KEY=optional
```

### Run
```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

### Build
```bash
npm run build
npm run preview
```

## Security Notes

- Do **not** commit `.env.local` or API keys.
- Rotate keys immediately if exposed.
- Set a strong `JWT_SECRET` in production.
- Restrict CORS and harden auth before public deployment.
```
