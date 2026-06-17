import { useEffect, useState } from 'react'
import { useHub } from '../../context/HubContext'

// ── Constants ────────────────────────────────────────────────

const CONTEXT_KEY = 'morning_hub_context'

const DEFAULT_CONTEXT = {
  version: '1.0',
  goals: [],
  context: { role: '', projects: '', people: '', constraints: '' },
  flags: [
    'deadline_conflicts',
    'unprepped_client_meetings',
    'missing_agendas',
    'personal_dates_approaching',
    'at_risk_goal_tasks',
  ],
  preferences: {
    location: 'Lincoln Park, Chicago, IL',
    locationLat: 41.9203,
    locationLon: -87.6349,
    wake_time: '06:30',
    briefing_tone: 'concise',
  },
}

const HORIZONS = [
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'monthly',   label: 'Monthly'   },
  { key: 'weekly',    label: 'Weekly'    },
]

const STATUS_OPTS = [
  { value: 'on-track', label: 'On track', cls: 'status-on-track' },
  { value: 'at-risk',  label: 'At risk',  cls: 'status-at-risk'  },
  { value: 'blocked',  label: 'Blocked',  cls: 'status-at-risk'  },
  { value: 'complete', label: 'Complete', cls: 'status-complete'  },
]

const DEFAULT_FLAGS = [
  'deadline_conflicts',
  'unprepped_client_meetings',
  'missing_agendas',
  'personal_dates_approaching',
  'at_risk_goal_tasks',
]

// ── Helpers ──────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function loadContext() {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY)
    if (!raw) return structuredClone(DEFAULT_CONTEXT)
    const saved = JSON.parse(raw)
    return {
      ...DEFAULT_CONTEXT,
      ...saved,
      context:     { ...DEFAULT_CONTEXT.context,     ...saved.context     },
      preferences: { ...DEFAULT_CONTEXT.preferences, ...saved.preferences },
    }
  } catch {
    return structuredClone(DEFAULT_CONTEXT)
  }
}

function saveContext(ctx) {
  localStorage.setItem(CONTEXT_KEY, JSON.stringify({
    ...ctx,
    updated_at: new Date().toISOString(),
  }))
}

// ── Icons ────────────────────────────────────────────────────

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

// ── Goal form ────────────────────────────────────────────────

function GoalForm({ initial, horizon, onSave, onCancel }) {
  const [title,    setTitle]    = useState(initial?.title    ?? '')
  const [status,   setStatus]   = useState(initial?.status   ?? 'on-track')
  const [metric,   setMetric]   = useState(initial?.metric   ?? '')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')

  function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      id:       initial?.id ?? uid(),
      horizon,
      title:    title.trim(),
      status,
      metric:   metric.trim(),
      deadline,
      progress: initial?.progress ?? 0,
    })
  }

  return (
    <form className="goal-form" onSubmit={submit}>
      <input
        className="context-input"
        placeholder="Goal title…"
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
      />
      <div className="goal-form-row">
        <select
          className="context-input goal-form-select"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          className="context-input"
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>
      <input
        className="context-input"
        placeholder="Success metric…"
        value={metric}
        onChange={e => setMetric(e.target.value)}
      />
      <div className="goal-form-actions">
        <button type="button" className="goal-action-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="goal-action-btn primary">Save goal</button>
      </div>
    </form>
  )
}

// ── Goals tab ────────────────────────────────────────────────

function GoalsTab({ goals, onChange }) {
  const [adding,  setAdding]  = useState(null)
  const [editing, setEditing] = useState(null)

  function handleSave(goal) {
    const exists = goals.find(g => g.id === goal.id)
    onChange(exists
      ? goals.map(g => g.id === goal.id ? goal : g)
      : [...goals, goal]
    )
    setAdding(null)
    setEditing(null)
  }

  function handleDelete(id) {
    onChange(goals.filter(g => g.id !== id))
  }

  return (
    <div>
      {HORIZONS.map(h => {
        const hGoals = goals.filter(g => g.horizon === h.key)
        return (
          <div key={h.key} className="horizon-block">
            <div className="horizon-label">
              {h.label}
              <span onClick={() => { setAdding(h.key); setEditing(null) }}>+ Add goal</span>
            </div>

            {hGoals.map(g => {
              const s = STATUS_OPTS.find(o => o.value === g.status) ?? STATUS_OPTS[0]
              if (editing === g.id) {
                return (
                  <GoalForm
                    key={g.id}
                    initial={g}
                    horizon={h.key}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                  />
                )
              }
              return (
                <div key={g.id} className="goal-card">
                  <div className="goal-card-top">
                    <div className="goal-card-title">{g.title}</div>
                    <span className={`goal-status ${s.cls}`}>{s.label}</span>
                  </div>
                  {g.metric && <div className="goal-metric">Success metric: {g.metric}</div>}
                  {g.deadline && <div className="goal-metric">Deadline: {new Date(g.deadline + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                  <div className="goal-progress-bar" style={{ marginTop: 8 }}>
                    <div className={`goal-progress-fill${g.status === 'at-risk' || g.status === 'blocked' ? ' terra' : ''}`} style={{ width: `${g.progress ?? 0}%` }} />
                  </div>
                  <div className="goal-card-actions">
                    <button className="goal-action-btn" onClick={() => { setEditing(g.id); setAdding(null) }}>Edit</button>
                    <button className="goal-action-btn" onClick={() => handleDelete(g.id)} style={{ color: 'var(--terra)' }}>
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )
            })}

            {adding === h.key && (
              <GoalForm
                horizon={h.key}
                onSave={handleSave}
                onCancel={() => setAdding(null)}
              />
            )}

            {adding !== h.key && (
              <button className="add-goal-btn" onClick={() => { setAdding(h.key); setEditing(null) }}>
                <PlusIcon /> Add {h.label.toLowerCase()} goal
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Context tab ──────────────────────────────────────────────

function ContextTab({ context, flags, onChange, onFlagsChange }) {
  const [newFlag, setNewFlag] = useState('')

  function update(field, val) {
    onChange({ ...context, [field]: val })
  }

  function removeFlag(f) {
    onFlagsChange(flags.filter(x => x !== f))
  }

  function addFlag(e) {
    e.preventDefault()
    const val = newFlag.trim().toLowerCase().replace(/\s+/g, '_')
    if (val && !flags.includes(val)) onFlagsChange([...flags, val])
    setNewFlag('')
  }

  return (
    <div>
      <p className="context-intro">This is what Claude reads before every briefing. Be direct — the more specific you are, the better the prioritization.</p>

      <label className="context-field-label">Role &amp; current focus</label>
      <textarea
        className="context-textarea"
        rows="3"
        placeholder="Your role, current priorities, and what you're focused on this quarter…"
        value={context.role}
        onChange={e => update('role', e.target.value)}
      />

      <label className="context-field-label">Active projects</label>
      <textarea
        className="context-textarea"
        rows="4"
        placeholder="List your active projects, their status, and what's at stake…"
        value={context.projects}
        onChange={e => update('projects', e.target.value)}
      />

      <label className="context-field-label">Key people</label>
      <textarea
        className="context-textarea"
        rows="3"
        placeholder="Names, roles, and anything Claude should know about them…"
        value={context.people}
        onChange={e => update('people', e.target.value)}
      />

      <label className="context-field-label">Working style &amp; constraints</label>
      <textarea
        className="context-textarea"
        rows="3"
        placeholder="Deep work windows, protected time, preferences…"
        value={context.constraints}
        onChange={e => update('constraints', e.target.value)}
      />

      <label className="context-field-label">What Claude should always flag</label>
      <div className="context-tag-row">
        {flags.map(f => (
          <span key={f} className="context-tag">
            {f.replace(/_/g, ' ')}
            <span className="tag-x" onClick={() => removeFlag(f)}>×</span>
          </span>
        ))}
      </div>
      <form className="flag-add-row" onSubmit={addFlag}>
        <input
          className="context-input flag-add-input"
          placeholder="Add a flag rule…"
          value={newFlag}
          onChange={e => setNewFlag(e.target.value)}
        />
        <button type="submit" className="goal-action-btn primary" disabled={!newFlag.trim()}>Add</button>
      </form>
      <p className="context-hint">These surface as orange flags on your daily briefing.</p>
    </div>
  )
}

// ── Preferences tab ──────────────────────────────────────────

function PrefsTab({ prefs, onChange }) {
  const [geocoding,   setGeocoding]   = useState(false)
  const [geocodeMsg,  setGeocodeMsg]  = useState('')

  function update(field, val) {
    onChange({ ...prefs, [field]: val })
  }

  async function geocode() {
    if (!prefs.location.trim()) return
    setGeocoding(true)
    setGeocodeMsg('')
    try {
      const resp = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(prefs.location)}&count=1&language=en&format=json`
      )
      const data = await resp.json()
      const r = data.results?.[0]
      if (!r) { setGeocodeMsg('Location not found — try a city name'); return }
      onChange({
        ...prefs,
        location:    `${r.name}, ${r.admin1}`,
        locationLat: r.latitude,
        locationLon: r.longitude,
      })
      setGeocodeMsg(`Verified: ${r.name}, ${r.admin1} (${r.latitude.toFixed(2)}, ${r.longitude.toFixed(2)})`)
    } catch {
      setGeocodeMsg('Geocoding failed — check your connection')
    } finally {
      setGeocoding(false)
    }
  }

  return (
    <div>
      <label className="context-field-label">Location</label>
      <div className="pref-row">
        <input
          className="context-input"
          style={{ flex: 1 }}
          value={prefs.location}
          onChange={e => { update('location', e.target.value); setGeocodeMsg('') }}
          placeholder="City, State"
        />
        <button className="goal-action-btn primary" onClick={geocode} disabled={geocoding}>
          {geocoding ? '…' : 'Verify'}
        </button>
      </div>
      {geocodeMsg && (
        <p className={`context-hint${geocodeMsg.startsWith('Verified') ? ' hint-ok' : ''}`}>
          {geocodeMsg}
        </p>
      )}
      <p className="context-hint">Used for weather. Click Verify to update coordinates. Takes effect on next page load.</p>

      <label className="context-field-label">Wake time</label>
      <input
        className="context-input"
        type="time"
        value={prefs.wake_time}
        onChange={e => update('wake_time', e.target.value)}
        style={{ width: 'auto' }}
      />

      <label className="context-field-label">Briefing tone</label>
      <div className="context-tag-row" style={{ marginTop: 6 }}>
        {['concise', 'warm', 'detailed'].map(t => (
          <span
            key={t}
            className="context-tag"
            style={prefs.briefing_tone === t
              ? { background: 'rgba(30,30,30,0.88)', color: '#fff', borderColor: 'transparent' }
              : {}}
            onClick={() => update('briefing_tone', t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </span>
        ))}
      </div>
      <p className="context-hint">Controls how much Claude writes in your morning greeting and summary.</p>
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────

const SP_TABS = [
  { id: 'goals',   label: 'Goals'       },
  { id: 'context', label: 'Context'     },
  { id: 'prefs',   label: 'Preferences' },
]

export default function SettingsPanel() {
  const { settingsOpen, closeSettings, activeSpTab, setActiveSpTab, briefing } = useHub()

  const [draft,   setDraft]   = useState(loadContext)
  const [saved,   setSaved]   = useState(false)

  // Reload draft whenever panel opens so it reflects latest saved state
  useEffect(() => {
    if (settingsOpen) setDraft(loadContext())
  }, [settingsOpen])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') closeSettings() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeSettings])

  function handleSave() {
    saveContext(draft)
    setSaved(true)
    briefing.refresh()
    setTimeout(() => { setSaved(false); closeSettings() }, 1000)
  }

  function handleCancel() {
    setDraft(loadContext())
    closeSettings()
  }

  return (
    <>
      <div className={`settings-backdrop${settingsOpen ? ' open' : ''}`} onClick={handleCancel} />
      <div className={`settings-panel${settingsOpen ? ' open' : ''}`}>
        <div className="sp-header">
          <div className="sp-title-group">
            <span className="sp-script">configure</span>
            <h2 className="sp-title">Goals &amp; <em>Context</em></h2>
          </div>
          <button className="sp-close" onClick={handleCancel}><XIcon /></button>
        </div>

        <div className="sp-tabs">
          {SP_TABS.map(tab => (
            <button
              key={tab.id}
              className={`sp-tab${activeSpTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveSpTab(tab.id)}
            >{tab.label}</button>
          ))}
        </div>

        <div className="sp-body">
          <div className={`sp-section${activeSpTab === 'goals' ? ' active' : ''}`}>
            <GoalsTab
              goals={draft.goals}
              onChange={goals => setDraft(d => ({ ...d, goals }))}
            />
          </div>
          <div className={`sp-section${activeSpTab === 'context' ? ' active' : ''}`}>
            <ContextTab
              context={draft.context}
              flags={draft.flags}
              onChange={context => setDraft(d => ({ ...d, context }))}
              onFlagsChange={flags => setDraft(d => ({ ...d, flags }))}
            />
          </div>
          <div className={`sp-section${activeSpTab === 'prefs' ? ' active' : ''}`}>
            <PrefsTab
              prefs={draft.preferences}
              onChange={preferences => setDraft(d => ({ ...d, preferences }))}
            />
          </div>
        </div>

        <div className="sp-footer">
          <button className="sp-cancel-btn" onClick={handleCancel}>Cancel</button>
          <button className="sp-save-btn" onClick={handleSave} disabled={saved}>
            {saved ? <><CheckIcon /> Saved</> : 'Save & Update Briefing'}
          </button>
        </div>
      </div>
    </>
  )
}
