import { useCallback, useEffect, useRef, useState } from 'react'

const CONTEXT_KEY = 'morning_hub_context'

function loadContext() {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function buildSystemPrompt(context) {
  const goals = context?.goals?.length
    ? context.goals
        .map(g => `${(g.horizon || 'goal').toUpperCase()}: ${g.title} — ${g.status || 'active'}${g.deadline ? `, deadline ${g.deadline}` : ''}`)
        .join('\n')
    : '(No goals configured yet — user will add these in Settings)'

  const projects = context?.projects?.length
    ? context.projects
        .map(p => `${p.name} → goal: ${p.goal_refs?.[0] || 'unlinked'}, ${(p.alignment_type || 'direct').toUpperCase()}, health: ${p.health || 'green'}`)
        .join('\n')
    : '(No projects configured yet)'

  const flags = context?.flags?.length
    ? context.flags.join(', ')
    : 'deadline_conflicts, unprepped_client_meetings, missing_agendas, personal_dates_approaching, at_risk_goal_tasks'

  const constraints = context?.constraints
    ? `deep_work_before: ${context.constraints.deep_work_before || '10:00'}, location: ${context.constraints.location || 'Chicago'}`
    : 'deep_work_before: 10:00, location: Chicago'

  return `You are the intelligence layer of a personal morning briefing hub. Read the user's goals, projects, and today's schedule, then return a structured JSON prioritization of every calendar event — ranked by how directly each one advances the user's active goals.

GOALS (source of truth — everything is weighed against these):
${goals}

ACTIVE PROJECTS (with goal alignment):
${projects}

FLAG RULES (always surface these conditions regardless of priority score):
${flags}

CONSTRAINTS:
${constraints}

PRIORITIZATION RULES:
1. Items directly advancing an active goal → priority_score 75–100, goal_alignment: "direct"
2. Items touching a goal-linked project but not directly advancing it → score 40–74, goal_alignment: "partial", flagged: true
3. Items with no goal connection → score 0–39, deprioritized: true
4. Flag rule matches → always include in the flags array regardless of score
5. Personal items (health appointments, personal errands, social) scored 0–100 on a separate scale; never compete directly with work goals

Respond ONLY with valid JSON. No preamble, no markdown fences, no text outside the JSON.

{
  "greeting": "one warm sentence acknowledging the shape of the day",
  "date": "Tuesday, June 17",
  "summary": "2-3 sentence plain-language briefing of what matters most today and why",
  "flags": [{ "rule": "flag_rule_name", "text": "plain explanation of what triggered this", "item": "the event or task name" }],
  "items": [{
    "title": "event or task name",
    "type": "task | meeting | personal",
    "priority_score": 0-100,
    "goal_alignment": "direct | partial | none",
    "goal_ref": "goal title or null",
    "rationale": "one sentence explaining the score",
    "flagged": false,
    "deprioritized": false
  }]
}

Items sorted by priority_score descending. Include every calendar event.`
}

function eventsToText(events) {
  if (!events.length) return '(No events scheduled today)'
  return events
    .map(e => {
      let line = `${e.timeLabel} — ${e.name}`
      if (e.sub) line += ` (${e.sub})`
      if (e.isPast) line += ' [completed]'
      return line
    })
    .join('\n')
}

export default function useBriefing({ events, connected }) {
  const [briefing,  setBriefing]  = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const ranRef = useRef(false)

  const run = useCallback(async (currentEvents) => {
    setLoading(true)
    setError(null)

    const context = loadContext()
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })

    const userMessage = [
      `Today is ${today}.`,
      '',
      "Today's calendar:",
      eventsToText(currentEvents),
      '',
      "Today's tasks:",
      '(none yet — tasks will be configured in Settings)',
    ].join('\n')

    try {
      const resp = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-6',
          max_tokens: 1000,
          system:     buildSystemPrompt(context),
          messages:   [{ role: 'user', content: userMessage }],
        }),
      })

      if (!resp.ok) throw new Error(`Briefing API ${resp.status}`)

      const data  = await resp.json()
      const raw   = data.content?.[0]?.text ?? ''
      const clean = raw.replace(/```json|```/g, '').trim()
      setBriefing(JSON.parse(clean))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Run once when calendar connects and events are available
  useEffect(() => {
    if (!connected) {
      ranRef.current = false
      setBriefing(null)
      return
    }
    if (events.length === 0 || ranRef.current) return
    ranRef.current = true
    run(events)
  }, [connected, events.length, run]) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    ranRef.current = false
    if (connected && events.length > 0) {
      ranRef.current = true
      run(events)
    }
  }, [connected, events, run])

  return { briefing, loading, error, refresh }
}
