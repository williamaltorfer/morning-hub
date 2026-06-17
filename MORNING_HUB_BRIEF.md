# Morning Hub — Project Brief

> This document is the source of truth for the Morning Hub build.
> Claude Code should reference it at the start of every session.
> Do not deviate from the design system, architecture, or build sequence without explicit instruction.

---

## 1. What We're Building

Morning Hub is a personal intelligence PWA (Progressive Web App) — a daily briefing companion that helps its user start each day with clarity. It surfaces what's on the calendar, prioritizes tasks against active goals, curates a news feed, tracks personal life items, and responds to voice.

The experience should feel like a premium morning ritual — calm, focused, and quietly intelligent. Every design and product decision should serve that feeling.

**Primary user:** A single person (Bill). This is not a multi-tenant SaaS product. Authentication exists only to protect personal data and enable cross-device sync.

**Core value proposition:** The hub knows what you're trying to achieve (goals), understands what's true about your world right now (context), and uses that to filter noise and surface what actually matters — proactively, every morning.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React (Vite) | Component-based, ready for the complexity ahead |
| Styling | CSS custom properties + modules | No Tailwind — use the brand token system below |
| Hosting | Vercel | Deploy from GitHub on every push to `main` |
| Calendar | Google Calendar API | OAuth 2.0, read events for today and next 7 days |
| Weather | Open-Meteo API | Free, no key required, lat/lng for Chicago |
| News | RSS via `rss2json.com` | Aggregated client-side to start |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) | Context-aware prioritization, meeting prep, voice |
| Context store | `localStorage` → Supabase (Phase 2) | Context schema JSON, see Section 5 |
| Voice | Web Speech API | `SpeechRecognition` for input, `SpeechSynthesis` for output |

---

## 3. Design System

### Philosophy
**Warm Organic Modernism.** Light-themed, earthy, editorial, premium. The reference implementation is `morning-hub.html` — match it exactly. When in doubt, open the mockup.

### Background
The body background is a fixed multi-layer radial gradient, not a flat color. This is what gives the glass effects depth.

```css
background-color: #EAE4D6;
background-image:
  radial-gradient(ellipse 60% 50% at 15% 20%, rgba(74,92,69,0.20) 0%, transparent 60%),
  radial-gradient(ellipse 50% 60% at 85% 75%, rgba(181,98,42,0.13) 0%, transparent 55%),
  radial-gradient(ellipse 70% 40% at 50% 50%, rgba(242,235,227,0.45) 0%, transparent 70%),
  radial-gradient(ellipse 40% 50% at 80% 10%, rgba(140,136,128,0.09) 0%, transparent 50%);
background-attachment: fixed;
```

### Color Tokens

```css
:root {
  /* Base */
  --bg:           #FAF8F4;
  --surface:      #FFFFFF;
  --surface-2:    #F5F1EB;
  --border:       rgba(140,136,128,0.18);
  --border-s:     rgba(140,136,128,0.32);

  /* Brand */
  --sage:         #4A5C45;
  --sage-bg:      rgba(74,92,69,0.08);
  --charcoal:     #1E1E1E;
  --terra:        #B5622A;
  --terra-bg:     rgba(181,98,42,0.09);
  --terra-light:  #C97A45;
  --stone:        #8C8880;
  --stone-light:  #B5B2AD;
  --sand:         #F2EBE3;

  /* Glass */
  --glass-white:     rgba(255,255,255,0.70);
  --glass-dark:      rgba(20,18,15,0.76);
  --glass-sage:      rgba(74,92,69,0.80);
  --glass-border:    rgba(255,255,255,0.50);
  --glass-border-dk: rgba(255,255,255,0.12);
  --blur-sm:  blur(10px) saturate(1.5);
  --blur-md:  blur(20px) saturate(1.8);
  --blur-lg:  blur(32px) saturate(2.0);

  /* Layout */
  --r: 14px;
}
```

### Typography

```css
--serif:  'Cormorant Garamond', Georgia, serif;
--sans:   'Jost', sans-serif;
--script: 'Dancing Script', cursive;
```

Google Fonts import:
```
https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500;600&family=Dancing+Script:wght@400;500&display=swap
```

**Usage rules:**
- Cormorant Garamond: display, headlines, meeting names, news headlines, meal names. Use italic for warmth.
- Jost: all UI labels, navigation, buttons, metadata, body text. Uppercase + letter-spacing for section labels.
- Dancing Script: sparingly — "good morning" header script only.
- Section labels: `9px, Jost 500, letter-spacing: 0.2em, uppercase, color: var(--stone)`
- **No emojis anywhere.** Inline SVG icons only (Feather-style, stroke-width 1.6–2, round caps/joins).

### Glass Treatment

Every floating surface uses frosted glass, not flat white. The standard card:

```css
.card {
  background: rgba(255,255,255,0.68);
  backdrop-filter: blur(14px) saturate(1.6);
  -webkit-backdrop-filter: blur(14px) saturate(1.6);
  border-radius: var(--r);
  border: 1px solid rgba(255,255,255,0.50);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.92) inset,
    0 4px 16px rgba(30,20,10,0.07);
}
```

Header / nav glass:
```css
background: rgba(255,255,255,0.70);
backdrop-filter: blur(28px) saturate(2.0);
-webkit-backdrop-filter: blur(28px) saturate(2.0);
border-bottom: 1px solid rgba(255,255,255,0.50);
box-shadow: 0 1px 0 rgba(255,255,255,0.95) inset;
```

Voice bar (dark glass):
```css
background: rgba(20,18,15,0.76);
backdrop-filter: blur(20px) saturate(1.8);
-webkit-backdrop-filter: blur(20px) saturate(1.8);
```

Weather card (sage glass):
```css
background: rgba(74,92,69,0.80);
backdrop-filter: blur(28px) saturate(2.0);
-webkit-backdrop-filter: blur(28px) saturate(2.0);
border: 1px solid rgba(255,255,255,0.20);
```

### Layout

**Desktop (≥900px):** Three-column fixed layout. Left column 300px (Day/Schedule), center column flexible (Tasks + Life), right column 280px (Feed). Columns scroll independently. Top header bar replaces bottom nav.

**Tablet (600–899px):** Two columns. Day left, Tasks+Life right. Feed accessible via separate view.

**Mobile (<600px):** Single column with fixed bottom tab navigation (Day / Tasks / Life / Feed). Sticky collapsing header — full on load, compresses to mini bar after 40px scroll. Voice bar slides away on scroll. Safe area insets via `env()`.

**Touch targets:** 44px minimum on mobile.

**Border radius:** `var(--r)` = 14px for cards. 8px for inline elements (pills, tabs, badges).

### Scrollbar
```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-thumb { background: var(--stone-light); border-radius: 2px; }
```

---

## 4. Navigation Structure

Four tabs, consistent across all breakpoints (bottom nav on mobile, top/sidebar on desktop):

| Tab | Icon | Contents |
|-----|------|----------|
| **Day** | Sun | Weather widget + today's schedule with meeting intelligence |
| **Tasks** | Checkbox | Priority task list, scoped by Today / Weekly / Monthly / Q2 |
| **Life** | Heart | Meals, grocery list, personal reminders, upcoming life items |
| **Feed** | Newspaper | Curated news feed with topic pills and Claude suggestions |

**Settings panel:** Slides in from the right (full-height overlay). Gear icon in header. Three tabs: Goals, Context, Preferences.

---

## 5. Context Schema

The context schema is the source of truth for all AI prioritization. It is stored in `localStorage` under the key `morning_hub_context` and injected into every Claude API call.

```json
{
  "version": "1.0",
  "updated_at": "ISO timestamp",

  "goals": [
    {
      "id": "string — stable slug, never changes",
      "title": "string",
      "horizon": "quarterly | monthly | weekly",
      "type": "outcome | metric | habit",
      "domain": "work | health | learning | relationships | finance",
      "success_metric": "string",
      "deadline": "ISO date",
      "status": "on-track | at-risk | blocked | complete",
      "progress": 0,
      "milestones": [
        { "title": "string", "due": "ISO date", "done": false }
      ],
      "target": null,
      "current": null,
      "unit": null,
      "cadence": null,
      "streak": null
    }
  ],

  "projects": [
    {
      "id": "string",
      "name": "string",
      "goal_refs": ["goal-id"],
      "alignment_type": "direct | supporting | maintenance",
      "status": "string",
      "health": "green | yellow | red",
      "deadline": "ISO date",
      "owner": "string",
      "collaborators": ["string"],
      "notes": "string"
    }
  ],

  "people": [
    {
      "id": "string",
      "name": "string",
      "type": "colleague | direct_report | client | personal | vendor",
      "sensitivity": "low | medium | high",
      "project_refs": ["project-id"],
      "important_dates": [
        { "label": "string", "date": "ISO date", "lead_days": 14 }
      ],
      "notes": "string"
    }
  ],

  "personal": {
    "health":        { "goal_refs": [], "items": [] },
    "learning":      { "goal_refs": [], "items": [], "current_book": null },
    "relationships": { "goal_refs": [], "items": [] },
    "finance":       { "goal_refs": [], "items": [] }
  },

  "constraints": {
    "deep_work_before": "10:00",
    "earliest_meeting": "08:30",
    "protected_blocks": [
      { "day": "friday", "from": "13:00", "label": "reading + planning" }
    ],
    "location": "Lincoln Park, Chicago, IL",
    "timezone": "America/Chicago"
  },

  "flags": [
    "deadline_conflicts",
    "unprepped_client_meetings",
    "missing_agendas",
    "personal_dates_approaching",
    "unlinked_projects",
    "at_risk_goal_tasks"
  ],

  "preferences": {
    "briefing_tone": "concise",
    "wake_time": "06:30",
    "feed": {
      "topics": ["AI", "performance marketing", "Chicago", "economy"],
      "follows": ["Ethan Mollick", "Lenny Rachitsky", "Elena Verna"]
    }
  }
}
```

---

## 6. Claude API — Morning Briefing Call

Model: `claude-sonnet-4-6`
Max tokens: `1000`
Called: on every app load, and when calendar or tasks change.

### System prompt pattern

```
You are the intelligence layer of a personal morning briefing hub.
Your job is to read the user's goals, projects, and today's schedule,
then return a structured prioritization of every item.

GOALS (source of truth):
{context.goals serialized}

ACTIVE PROJECTS:
{context.projects serialized}

FLAG RULES:
{context.flags joined}

CONSTRAINTS:
{context.constraints serialized}

TODAY'S CALENDAR:
{calendar events for today}

TODAY'S TASKS:
{task list}

PRIORITIZATION RULES:
1. Items directly advancing an active goal → score 75–100
2. Items touching a goal-linked project but not directly advancing → score 40–74, alignment: "partial", include in flags
3. Items with no goal connection → score 0–39, mark deprioritized
4. Flag rule matches → always surface in flags array regardless of score
5. Respect constraints as hard limits
6. Personal domain items scored 0–100 on separate scale, never compete with work goals

Return ONLY valid JSON — no preamble, no markdown fences:

{
  "greeting": "one warm sentence",
  "date": "string",
  "summary": "2-3 sentence plain-language briefing",
  "flags": [{ "rule": "", "text": "", "item": "" }],
  "items": [{
    "title": "",
    "type": "task | meeting | personal",
    "priority_score": 0-100,
    "goal_alignment": "direct | partial | none",
    "goal_ref": "goal id or null",
    "rationale": "one sentence",
    "flagged": false,
    "deprioritized": false
  }]
}

Items sorted by priority_score descending. Include every task and meeting.
```

### Response handling

```javascript
const data = await response.json();
const text = data.content[0].text;
const clean = text.replace(/```json|```/g, '').trim();
const parsed = JSON.parse(clean);
```

Always wrap in try/catch. On parse failure, show a graceful fallback (plain list of today's events, no AI scoring).

---

## 7. Data Sources

### Weather — Open-Meteo
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=41.9239&longitude=-87.6517
  &current=temperature_2m,weather_code,wind_speed_10m
  &hourly=temperature_2m,weather_code
  &temperature_unit=fahrenheit
  &wind_speed_unit=mph
  &timezone=America/Chicago
  &forecast_days=1
```
No API key required. Refresh every 30 minutes.

### Google Calendar
- Scope: `https://www.googleapis.com/auth/calendar.readonly`
- Fetch events for today: `GET /calendars/primary/events` with `timeMin` and `timeMax` set to today's start/end in ISO format
- OAuth 2.0 via Google Identity Services (`accounts.google.com/gsi/client`)
- Store token in `localStorage`, refresh on expiry

### News — RSS via rss2json
```
GET https://api.rss2json.com/v1/api.json?rss_url={encoded_feed_url}
```
Default feeds to aggregate:
- The Verge AI: `https://www.theverge.com/rss/ai-artificial-intelligence/index.xml`
- Marketing Brew: `https://www.marketingbrew.com/feeds/posts`
- Chicago Tribune: `https://www.chicagotribune.com/feed/`
- WSJ Economy: `https://feeds.wsj.com/xml/rss/3_7085.xml`

Fetch on load, cache in `sessionStorage` for the session.

---

## 8. Component Architecture

```
src/
├── main.jsx
├── App.jsx                    # Layout router, layout detection (mobile/desktop)
├── context/
│   └── HubContext.jsx         # Global state: context schema, calendar, tasks, briefing
├── hooks/
│   ├── useWeather.js          # Open-Meteo fetch + refresh
│   ├── useCalendar.js         # Google Calendar OAuth + events
│   ├── useBriefing.js         # Claude API call, returns scored items
│   └── useNews.js             # RSS aggregation
├── components/
│   ├── layout/
│   │   ├── DesktopLayout.jsx  # 3-col grid
│   │   ├── MobileLayout.jsx   # Tab shell + bottom nav
│   │   ├── Header.jsx         # Collapsing mobile header / desktop top bar
│   │   └── VoiceBar.jsx       # Dark glass voice input bar
│   ├── day/
│   │   ├── WeatherCard.jsx    # Sage glass weather widget
│   │   ├── MeetingList.jsx    # Schedule with now-line
│   │   └── MeetingItem.jsx    # Expandable meeting card with drawer
│   ├── tasks/
│   │   ├── TaskList.jsx       # Scoped by horizon tab
│   │   └── TaskItem.jsx       # Checkable row with priority badge
│   ├── life/
│   │   ├── MealPlan.jsx       # Today's meals
│   │   ├── GroceryList.jsx    # List with add/remove
│   │   └── PersonalReminders.jsx
│   ├── feed/
│   │   ├── NewsFeed.jsx       # Topic-filtered article list
│   │   └── NewsItem.jsx       # Article card
│   └── settings/
│       ├── SettingsPanel.jsx  # Slide-in overlay
│       ├── GoalsEditor.jsx    # Goal CRUD by horizon
│       └── ContextEditor.jsx  # Free-form context fields
└── styles/
    ├── tokens.css             # All CSS custom properties
    ├── glass.css              # Glass mixin classes
    └── typography.css         # Type scale
```

---

## 9. Build Sequence

Build in this exact order. Do not skip ahead. Each step should be fully working before the next begins.

| Step | What to build | Done when |
|------|--------------|-----------|
| **1** | Vite + React scaffold, deploy to Vercel | Live URL exists, blank app loads |
| **2** | Design tokens + global CSS, component shell matching mockup | Looks identical to `morning-hub.html` at all breakpoints |
| **3** | Open-Meteo weather integration | Real Chicago weather in the widget |
| **4** | Google Calendar OAuth + today's events | Real meetings appear in schedule |
| **5** | Claude API — morning briefing call | Tasks and meetings are scored and ranked |
| **6** | RSS news feed | Real articles in Feed tab |
| **7** | Settings panel — Goals + Context editor | Context saves to localStorage, feeds into API call |
| **8** | Voice interface | Speak to the hub, get spoken responses |

Future phases (post-v1):
- Actions layer (order gifts, add groceries, create calendar events)
- Supabase sync for cross-device context
- Meeting recording + transcript search
- Meal planning intelligence

---

## 10. Rules for Claude Code

1. **Match the mockup.** The HTML file `morning-hub.html` is the visual reference. Every component should be pixel-matched to it. When building a component, describe which section of the mockup it corresponds to.

2. **Use the token system.** Never hardcode a color, font, or spacing value that exists as a CSS custom property. Always reference `var(--token-name)`.

3. **No emojis.** All icons are inline SVG, Feather-style, stroke-width 1.6–2, round caps and joins.

4. **Glass on every surface.** No flat white cards. Every card and header uses the glass treatment defined in Section 3.

5. **One step at a time.** Complete and verify each build step before moving to the next. Don't wire up Calendar before the shell is visually correct.

6. **Graceful fallbacks.** Every data fetch (weather, calendar, Claude API) must have a loading state and a graceful error state. The hub should always render something useful even if a data source fails.

7. **Mobile-first.** Write mobile CSS first, then layer in desktop overrides with `@media (min-width: 600px)` and `@media (min-width: 900px)`.

8. **Context schema is sacred.** Never change the shape of the context schema without explicit instruction. All reads and writes go through `HubContext.jsx`.

9. **Claude API calls are structured.** Every Claude call returns JSON. Always strip markdown fences before parsing. Always wrap in try/catch. Never display raw API responses to the user.

10. **Commit after each step.** After each build step is verified, commit to `main` with a clear message: `feat: step 2 — design tokens and component shell`.

---

## 11. Environment Variables

```
VITE_ANTHROPIC_API_KEY=
VITE_GOOGLE_CLIENT_ID=
VITE_RSS2JSON_API_KEY=       # free tier available at rss2json.com
```

Set in Vercel dashboard under Project Settings → Environment Variables. Never commit `.env` to the repo.

---

## 12. Reference Files

| File | Purpose |
|------|---------|
| `morning-hub.html` | Canonical visual mockup — the design reference |
| `morning-briefing-api.html` | Working Claude API call demo with prompt pattern |
| `MORNING_HUB_BRIEF.md` | This file |

---

*Last updated: project kickoff. Update `updated_at` whenever the schema or architecture changes.*
