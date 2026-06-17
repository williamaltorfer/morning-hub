import { useCallback, useEffect, useRef, useState } from 'react'

const TASKS_KEY       = 'morning_hub_tasks'
const SUGGESTIONS_KEY = 'morning_hub_task_suggestions'
const SUGGESTIONS_TTL = 4 * 60 * 60 * 1000 // 4 hours

// ── Storage helpers ──────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveTasks(tasks) {
  try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)) } catch {}
}

function loadCachedSuggestions() {
  try {
    const raw = sessionStorage.getItem(SUGGESTIONS_KEY)
    if (!raw) return null
    const { ts, items } = JSON.parse(raw)
    return Date.now() - ts < SUGGESTIONS_TTL ? items : null
  } catch { return null }
}

function cacheSuggestions(items) {
  try {
    sessionStorage.setItem(SUGGESTIONS_KEY, JSON.stringify({ ts: Date.now(), items }))
  } catch {}
}

function loadGoals() {
  try {
    const raw = localStorage.getItem('morning_hub_context')
    return raw ? (JSON.parse(raw)?.goals ?? []) : []
  } catch { return [] }
}

// ── Claude prompt for task suggestions ──────────────────────

function buildSuggestionPrompt(activeGoals, existingTasks) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const goalsText = activeGoals
    .map(g =>
      `[${g.id}] ${(g.horizon || 'goal').toUpperCase()}: ${g.title}` +
      (g.metric   ? ` — success metric: ${g.metric}`   : '') +
      (g.deadline ? ` — deadline: ${g.deadline}`       : '') +
      ` (${g.status})`
    )
    .join('\n')

  const existingText = existingTasks.filter(t => !t.done).length
    ? existingTasks
        .filter(t => !t.done)
        .map(t => `- ${t.title} (${t.horizon}, goal: ${t.goalRef || 'unlinked'})`)
        .join('\n')
    : '(none yet)'

  const system = `You are a goal alignment assistant for a personal productivity hub. Given the user's active goals and their existing task list, generate specific, actionable next steps that will advance each goal within its time horizon.

Rules:
- 2–3 suggestions per active goal, prioritized by impact
- Tasks must be concrete and completable within the goal's horizon
- Do NOT repeat or closely paraphrase anything already in the existing task list
- For quarterly goals: milestone-level tasks (multi-week chunks)
- For monthly goals: project-chunk tasks (completable in 1–5 days)
- For weekly goals: specific daily actions (completable today or this week)
- Work backward from the success metric when one is set

Today is ${today}.

Return ONLY valid JSON, no preamble, no markdown fences:
{
  "suggestions": [
    {
      "title": "specific actionable task title",
      "goalRef": "exact goal id from the list above",
      "goalTitle": "goal title for display",
      "horizon": "weekly | monthly | quarterly",
      "priority": "high | medium | low",
      "suggestedDue": "YYYY-MM-DD or null",
      "rationale": "one sentence — why this task, why now"
    }
  ]
}`

  const user = `ACTIVE GOALS:\n${goalsText}\n\nEXISTING TASKS (do not duplicate):\n${existingText}`

  return { system, user }
}

// ── Hook ─────────────────────────────────────────────────────

export default function useTasks() {
  const [tasks,       setTasks]       = useState(loadTasks)
  const [suggestions, setSuggestions] = useState(() => loadCachedSuggestions() ?? [])
  const [generating,  setGenerating]  = useState(false)

  const tasksRef = useRef(tasks)
  useEffect(() => { tasksRef.current = tasks }, [tasks])

  function mutate(updater) {
    setTasks(prev => {
      const next = updater(prev)
      saveTasks(next)
      return next
    })
  }

  const addTask = useCallback((data) => {
    mutate(prev => [...prev, {
      id:        uid(),
      done:      false,
      source:    'manual',
      createdAt: new Date().toISOString(),
      ...data,
    }])
  }, [])

  const updateTask = useCallback((id, patch) => {
    mutate(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }, [])

  const deleteTask = useCallback((id) => {
    mutate(prev => prev.filter(t => t.id !== id))
  }, [])

  const toggleDone = useCallback((id) => {
    mutate(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }, [])

  const acceptSuggestion = useCallback((s) => {
    mutate(prev => [...prev, {
      id:        uid(),
      title:     s.title,
      goalRef:   s.goalRef,
      goalTitle: s.goalTitle,
      horizon:   s.horizon,
      priority:  s.priority,
      dueDate:   s.suggestedDue ?? null,
      done:      false,
      source:    'suggested',
      createdAt: new Date().toISOString(),
    }])
    setSuggestions(prev => {
      const next = prev.filter(x => x.id !== s.id)
      cacheSuggestions(next)
      return next
    })
  }, [])

  const dismissSuggestion = useCallback((id) => {
    setSuggestions(prev => {
      const next = prev.filter(x => x.id !== id)
      cacheSuggestions(next)
      return next
    })
  }, [])

  const generateSuggestions = useCallback(async () => {
    const goals  = loadGoals()
    const active = goals.filter(g => g.status !== 'complete')
    if (!active.length) return

    setGenerating(true)
    setSuggestions([])
    try {
      const { system, user } = buildSuggestionPrompt(active, tasksRef.current)
      const resp = await fetch('/api/briefing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 800,
          system,
          messages:   [{ role: 'user', content: user }],
        }),
      })
      if (!resp.ok) throw new Error(`API ${resp.status}`)
      const data    = await resp.json()
      const raw     = data.content?.[0]?.text ?? ''
      const clean   = raw.replace(/```json|```/g, '').trim()
      const parsed  = JSON.parse(clean)
      const withIds = (parsed.suggestions ?? []).map(s => ({ ...s, id: uid() }))
      setSuggestions(withIds)
      cacheSuggestions(withIds)
    } catch (err) {
      console.error('Task suggestion generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }, [])

  // Auto-generate once on mount if goals exist and nothing is cached
  useEffect(() => {
    const cached = loadCachedSuggestions()
    if (!cached) {
      const goals = loadGoals()
      if (goals.filter(g => g.status !== 'complete').length > 0) {
        generateSuggestions()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tasks,
    suggestions,
    generating,
    addTask,
    updateTask,
    deleteTask,
    toggleDone,
    acceptSuggestion,
    dismissSuggestion,
    generateSuggestions,
  }
}

// ── Exported helpers for briefing integration ────────────────

export function loadTasksForBriefing() {
  const tasks = loadTasks()
  if (!tasks.length) return '(no tasks configured yet)'
  return tasks
    .filter(t => !t.done)
    .map(t =>
      `[${(t.horizon || 'task').toUpperCase()}] ${t.title}` +
      (t.dueDate ? ` — due ${t.dueDate}` : '') +
      (t.priority ? ` (${t.priority})` : '') +
      (t.goalRef  ? ` → ${t.goalTitle || t.goalRef}` : '')
    )
    .join('\n') || '(all tasks completed)'
}
