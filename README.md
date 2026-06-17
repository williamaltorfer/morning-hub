# Morning Hub

A personal intelligence PWA — a daily briefing companion that surfaces what's on the calendar, prioritizes tasks against active goals, curates a news feed, and responds to voice. Built for one user, deployed as a progressive web app.

## What it does

**Day** — Live weather (Open-Meteo) + today's Google Calendar schedule. Each event is scored by Claude against your active goals: how directly does this meeting advance what you're trying to accomplish? Flagged events (unprepped meetings, deadline conflicts) surface at the top.

**Tasks** — Hybrid manual + AI-generated task list. Claude Haiku reads your quarterly, monthly, and weekly goals and suggests specific, actionable next steps aligned to each one. Tasks you add manually and accepted suggestions are stored locally and persist across sessions.

**Life** — Personal section pulls birthdays and anniversaries from Google Calendar (2-week lookahead). Upcoming section surfaces appointments, flights, trips, and full-day events from the same window.

**Feed** — Curated RSS news feed with topic labels. Add any RSS feed, assign it to a label, filter by topic. Labels are fully manageable: create, rename, delete, and reassign feeds inline.

**Voice** — Speak a question or intent; the hub responds using your calendar context and morning briefing. Uses the Web Speech API for input and output, routed through Claude Haiku.

**Settings** — Goals editor (quarterly / monthly / weekly, with success metrics and deadlines), free-form context fields (role, active projects, key people, working constraints), and preferences (location, wake time, briefing tone). Everything feeds into the Claude system prompt.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | React + Vite (PWA) |
| Hosting | Vercel (deploy on push to `main`) |
| Styling | CSS custom properties — no Tailwind, no hardcoded values |
| Calendar | Google Calendar API via OAuth 2.0 (GIS) |
| Weather | Open-Meteo (no key required) |
| News | RSS via rss2json proxy |
| AI — briefing | `claude-sonnet-4-6` via Vercel serverless function |
| AI — tasks/voice | `claude-haiku-4-5-20251001` via Vercel serverless function |
| Voice I/O | Web Speech API (`SpeechRecognition` + `SpeechSynthesis`) |
| State | React context + `localStorage` |

## Local development

```bash
npm install
npm run dev       # localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build
npm run lint
```

Copy `.env.local.example` to `.env.local` and fill in your keys:

```
ANTHROPIC_API_KEY=        # server-side only — never VITE_ prefix
RSS2JSON_API_KEY=         # server-side only — never VITE_ prefix
VITE_GOOGLE_CLIENT_ID=    # client-safe
```

The Anthropic and rss2json keys are used exclusively in Vercel serverless functions (`api/briefing.js`, `api/news.js`) and are never exposed to the client bundle.

## Architecture notes

- `src/context/HubContext.jsx` — global state. Calendar, briefing, voice, feeds, and topics all live here.
- `src/hooks/useCalendar.js` — Google Calendar OAuth flow, today's events, special events (birthdays/anniversaries), and upcoming events (trips, appointments, flights).
- `src/hooks/useBriefing.js` — builds the Claude system prompt from stored goals and context, calls `/api/briefing`, parses the scored JSON response.
- `src/hooks/useTasks.js` — manual task CRUD + Claude-generated suggestions with 4-hour sessionStorage cache.
- `src/hooks/useVoice.js` — speech recognition → Claude Haiku → speech synthesis pipeline.
- `api/briefing.js` — Vercel serverless proxy for the Anthropic API (handles both briefing and voice intent calls). Anthropic prompt caching is enabled on the system prompt block.

### Design system

Warm Organic Modernism — earthy, editorial, frosted glass on every surface. Full token system in `src/styles/tokens.css`. No emojis; inline Feather-style SVGs only. Mobile-first CSS with tablet (`≥600px`) and desktop (`≥900px`) overrides.

### Context schema

User goals, context, and preferences are stored in `localStorage` under `morning_hub_context` and injected into every Claude API call. The schema shape is a contract — field names must not change without updating the Claude system prompt simultaneously.
