# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # local dev server (localhost:5173)
npm run build     # production build → dist/
npm run preview   # preview production build locally
npm run lint      # ESLint
```

## Architecture

React + Vite PWA deployed to Vercel. Single-user personal intelligence dashboard.

**4 main views** (tab-navigated): Day (schedule + weather), Tasks, Life (meals/reminders), Feed (news).

**State:** `HubContext.jsx` holds global state. User context/goals persisted to `localStorage` under key `morning_hub_context` — treat this schema as a contract; never alter field names without updating the Claude system prompt simultaneously.

**API proxies** (`/api/` — Vercel serverless functions, run server-side):
- `api/briefing.js` — proxies Anthropic Claude API (morning briefing + voice intents)
- `api/news.js` — proxies rss2json RSS aggregation

**Direct client calls** (no server needed):
- Open-Meteo weather (no key required)
- Google Calendar (OAuth token stored in localStorage)

**Environment variables:**
- `ANTHROPIC_API_KEY` and `RSS2JSON_API_KEY` — server-side only, never `VITE_` prefixed
- `VITE_GOOGLE_CLIENT_ID` — client-safe

## Design System

CSS custom properties only — no hardcoded color or spacing values. Key files:
- `src/styles/tokens.css` — all design tokens (colors, radius, blur levels)
- `src/styles/glass.css` — frosted glass utility classes
- `src/styles/typography.css` — Cormorant Garamond, Jost, Dancing Script

No emojis anywhere. Inline Feather-style SVGs only. Glass treatment on every card surface.

Mobile-first CSS (`<600px` base), tablet overrides (`600–899px`), desktop overrides (`≥900px`).

## Reference Files

- `morning-hub_mockup.html` — pixel-perfect UI target; match exactly
- `MORNING_HUB_BRIEF.md` — full product spec and context schema definition
- `morning-briefing-api.html` — working demo of the Claude briefing API call and system prompt pattern
