import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useHub } from '../../context/HubContext'
import useTasks from '../../hooks/useTasks'

// ── Constants ────────────────────────────────────────────────

const SCOPE_TABS = [
  { id: 'today',     label: 'Today'     },
  { id: 'weekly',    label: 'Weekly'    },
  { id: 'monthly',   label: 'Monthly'   },
  { id: 'quarterly', label: 'Quarterly' },
]

const PRIORITIES = [
  { value: 'critical', label: 'Critical', cls: 'pri-hi'  },
  { value: 'high',     label: 'High',     cls: 'pri-hi'  },
  { value: 'medium',   label: 'Medium',   cls: 'pri-med' },
  { value: 'low',      label: 'Low',      cls: 'pri-lo'  },
]

function priClass(p)  { return PRIORITIES.find(x => x.value === p)?.cls  ?? 'pri-lo' }
function priLabel(p)  { return PRIORITIES.find(x => x.value === p)?.label ?? 'Low'    }

// ── Helpers ──────────────────────────────────────────────────

function fmtDue(dateStr) {
  if (!dateStr) return null
  const due   = new Date(dateStr + 'T12:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff  = Math.floor((due - today) / 86400000)
  if (diff < -1) return `${Math.abs(diff)}d overdue`
  if (diff === -1) return 'Yesterday (overdue)'
  if (diff === 0)  return 'Due today'
  if (diff === 1)  return 'Due tomorrow'
  if (diff <= 7)   return `Due ${due.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
  return `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  const due   = new Date(dateStr + 'T12:00:00')
  const today = new Date(); today.setHours(23, 59, 59, 999)
  return due < today
}

function isToday(dateStr) {
  if (!dateStr) return false
  const due   = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  return due.toDateString() === today.toDateString()
}

const VALID_HORIZONS = new Set(['weekly', 'monthly', 'quarterly'])

function filterTasksByScope(tasks, scope) {
  switch (scope) {
    case 'today':
      return tasks.filter(t =>
        t.horizon === 'today' ||
        isToday(t.dueDate) ||
        (!t.done && t.dueDate && isOverdue(t.dueDate))
      )
    case 'weekly':
      // Include tasks explicitly tagged weekly, plus any with an unrecognized horizon
      return tasks.filter(t =>
        t.horizon === 'weekly' ||
        (t.horizon && !VALID_HORIZONS.has(t.horizon))
      )
    case 'monthly':
    case 'quarterly':
      return tasks.filter(t => t.horizon === scope)
    default:
      return tasks
  }
}

function groupByGoal(tasks, suggestions) {
  const groups = new Map()

  function ensureGroup(ref, title) {
    if (!groups.has(ref)) groups.set(ref, { goalTitle: title, tasks: [], suggestions: [] })
  }

  tasks.forEach(t => {
    const key = t.goalRef || '__unlinked__'
    ensureGroup(key, t.goalTitle || (key === '__unlinked__' ? 'Unlinked' : key))
    groups.get(key).tasks.push(t)
  })

  suggestions.forEach(s => {
    const key = s.goalRef || '__unlinked__'
    ensureGroup(key, s.goalTitle || (key === '__unlinked__' ? 'Unlinked' : key))
    groups.get(key).suggestions.push(s)
  })

  // Put unlinked last
  const ordered = [...groups.entries()].sort(([a], [b]) => {
    if (a === '__unlinked__') return 1
    if (b === '__unlinked__') return -1
    return 0
  })

  return ordered
}

function loadGoalOptions() {
  try {
    const raw = localStorage.getItem('morning_hub_context')
    return raw ? (JSON.parse(raw)?.goals ?? []).filter(g => g.status !== 'complete') : []
  } catch { return [] }
}

function loadAllGoals() {
  try {
    const raw = localStorage.getItem('morning_hub_context')
    return raw ? (JSON.parse(raw)?.goals ?? []) : []
  } catch { return [] }
}

// ── Icons ────────────────────────────────────────────────────

function TargetIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )
}

// ── Add Task Form ────────────────────────────────────────────

function AddTaskForm({ defaultHorizon, onSave, onCancel }) {
  const goals = loadGoalOptions()
  const [title,    setTitle]    = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate,  setDueDate]  = useState('')
  const [goalRef,  setGoalRef]  = useState('')

  function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    const goal = goals.find(g => g.id === goalRef)
    onSave({
      title:     title.trim(),
      horizon:   defaultHorizon,
      priority,
      dueDate:   dueDate || null,
      goalRef:   goalRef || null,
      goalTitle: goal?.title ?? null,
    })
  }

  return (
    <form className="task-add-form" onSubmit={submit}>
      <input
        className="context-input"
        placeholder="Task title…"
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
      />
      <div className="task-form-row">
        <select
          className="context-input task-form-select"
          value={priority}
          onChange={e => setPriority(e.target.value)}
        >
          {PRIORITIES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <input
          className="context-input"
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>
      {goals.length > 0 && (
        <select
          className="context-input"
          value={goalRef}
          onChange={e => setGoalRef(e.target.value)}
        >
          <option value="">No goal link</option>
          {goals.map(g => (
            <option key={g.id} value={g.id}>
              {g.horizon?.charAt(0).toUpperCase() + g.horizon?.slice(1)}: {g.title}
            </option>
          ))}
        </select>
      )}
      <div className="task-form-actions">
        <button type="button" className="goal-action-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="goal-action-btn primary">Add task</button>
      </div>
    </form>
  )
}

// ── Task Item ────────────────────────────────────────────────

function InlineDateEdit({ taskId, dueDate, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [flash,   setFlash]   = useState(false)
  const inputRef     = useRef(null)
  const committedRef = useRef(false)

  useEffect(() => {
    if (editing) {
      committedRef.current = false
      inputRef.current?.focus()
    }
  }, [editing])

  function commit(val) {
    if (committedRef.current) return
    committedRef.current = true
    onUpdate(taskId, { dueDate: val || null })
    setEditing(false)
    setFlash(true)
    setTimeout(() => setFlash(false), 1500)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="date"
        className="task-date-input"
        defaultValue={dueDate || ''}
        onChange={e => { if (e.target.value) commit(e.target.value) }}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') { committedRef.current = true; setEditing(false) }
        }}
        onClick={e => e.stopPropagation()}
      />
    )
  }

  const label   = fmtDue(dueDate)
  const overdue = dueDate && isOverdue(dueDate) && !isToday(dueDate)

  return (
    <span
      className={`t-due task-due-editable${!label ? ' t-due-empty' : ''}${flash ? ' t-due-flash' : ''}`}
      style={flash ? { color: 'var(--sage)' } : overdue ? { color: 'var(--terra)' } : {}}
      onClick={e => { e.stopPropagation(); setEditing(true) }}
      title="Click to change date"
    >
      {flash ? 'Saved' : (label || 'Set date')}
    </span>
  )
}

function TaskItem({ task, onToggle, onDelete, onUpdate }) {
  return (
    <div className={`todo-item${task.done ? ' task-done' : ''}`}>
      <div
        className={`t-check${task.done ? ' done' : ''}`}
        onClick={() => onToggle(task.id)}
        style={{ cursor: 'pointer', flexShrink: 0 }}
      />
      <div className="t-body" onClick={() => onToggle(task.id)} style={{ cursor: 'pointer', flex: 1 }}>
        <div className={`t-task${task.done ? ' done' : ''}`}>{task.title}</div>
        <div className="t-meta">
          <InlineDateEdit taskId={task.id} dueDate={task.dueDate} onUpdate={onUpdate} />
          <span className={`t-pri ${priClass(task.priority)}`}>{priLabel(task.priority)}</span>
        </div>
      </div>
      <button
        className="task-delete-btn"
        onClick={e => { e.stopPropagation(); onDelete(task.id) }}
        aria-label="Delete task"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

// ── Suggestion Item ──────────────────────────────────────────

function SuggestionItem({ s, onAccept, onDismiss }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="suggestion-item">
      <div className="suggestion-top">
        <span className="suggestion-badge"><SparkIcon /> Suggested</span>
        <div className="suggestion-title" onClick={() => setExpanded(e => !e)}>
          {s.title}
        </div>
      </div>
      {expanded && s.rationale && (
        <div className="suggestion-rationale">{s.rationale}</div>
      )}
      <div className="suggestion-meta">
        {s.suggestedDue && <span className="t-due">{fmtDue(s.suggestedDue)}</span>}
        <span className={`t-pri ${priClass(s.priority)}`}>{priLabel(s.priority)}</span>
      </div>
      <div className="suggestion-actions">
        <button className="goal-action-btn primary" onClick={() => onAccept(s)}>Accept</button>
        <button className="goal-action-btn" onClick={() => onDismiss(s.id)}>Dismiss</button>
      </div>
    </div>
  )
}

// ── Goal Group ───────────────────────────────────────────────

function GoalGroup({ goalKey, goalTitle, tasks, suggestions, onToggle, onDelete, onUpdate, onAccept, onDismiss }) {
  if (!tasks.length && !suggestions.length) return null
  const displayTitle = goalKey === '__unlinked__' ? 'Unlinked' : goalTitle

  return (
    <div>
      <div className="goal-label">{displayTitle}</div>
      {tasks.map(t => (
        <TaskItem
          key={t.id}
          task={t}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
      {suggestions.length > 0 && (
        <div className="suggestions-block">
          {suggestions.map(s => (
            <SuggestionItem
              key={s.id}
              s={s}
              onAccept={onAccept}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Goal View ────────────────────────────────────────────────

const HORIZON_ORDER = { quarterly: 0, monthly: 1, weekly: 2, today: 3 }
const STATUS_LABEL  = { 'on-track': 'On Track', 'at-risk': 'At Risk', blocked: 'Blocked', complete: 'Complete' }
const STATUS_CLS    = { 'on-track': 'status-on-track', 'at-risk': 'status-at-risk', blocked: 'status-at-risk', complete: 'status-complete' }

function GoalViewHeader({ goal, tasks }) {
  const total = tasks.length
  const done  = tasks.filter(t => t.done).length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  const deadline = goal.deadline
    ? new Date(goal.deadline + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline + 'T23:59:59') - new Date()) / 86400000)
    : null

  return (
    <div className="gv-header card">
      <div className="gv-header-top">
        <div>
          <div className="gv-horizon">{goal.horizon}</div>
          <div className="gv-title">{goal.title}</div>
        </div>
        <span className={`goal-status ${STATUS_CLS[goal.status] ?? 'status-on-track'}`}>
          {STATUS_LABEL[goal.status] ?? goal.status}
        </span>
      </div>

      {goal.metric && (
        <div className="gv-metric">
          <TargetIcon /> {goal.metric}
        </div>
      )}

      {deadline && (
        <div className="gv-deadline">
          <span>Target: {deadline}</span>
          {daysLeft !== null && (
            <span className={`gv-days ${daysLeft <= 14 ? 'urgent' : ''}`}>
              {daysLeft > 0 ? `${daysLeft}d remaining` : daysLeft === 0 ? 'Due today' : `${Math.abs(daysLeft)}d overdue`}
            </span>
          )}
        </div>
      )}

      {total > 0 && (
        <div className="gv-progress">
          <div className="gv-progress-bar">
            <div className="gv-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="gv-progress-label">{done}/{total} tasks complete</span>
        </div>
      )}
    </div>
  )
}

function GoalTaskItem({ task, onToggle, onDelete, onUpdate }) {
  return (
    <div className={`todo-item${task.done ? ' task-done' : ''}`}>
      <div
        className={`t-check${task.done ? ' done' : ''}`}
        onClick={() => onToggle(task.id)}
        style={{ cursor: 'pointer', flexShrink: 0 }}
      />
      <div className="t-body" onClick={() => onToggle(task.id)} style={{ cursor: 'pointer', flex: 1 }}>
        <div className={`t-task${task.done ? ' done' : ''}`}>{task.title}</div>
        <div className="t-meta">
          <InlineDateEdit taskId={task.id} dueDate={task.dueDate} onUpdate={onUpdate} />
          <span className={`t-pri ${priClass(task.priority)}`}>{priLabel(task.priority)}</span>
          <span className="gv-horizon-badge">{task.horizon}</span>
        </div>
      </div>
      <button
        className="task-delete-btn"
        onClick={e => { e.stopPropagation(); onDelete(task.id) }}
        aria-label="Delete task"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

// ── Main Section ─────────────────────────────────────────────

export default function TasksSection() {
  const { activeScopeTab, setActiveScopeTab } = useHub()
  const {
    tasks, suggestions, generating, generateError,
    addTask, updateTask, toggleDone, deleteTask,
    acceptSuggestion, dismissSuggestion, generateSuggestions,
  } = useTasks()

  const [showAddForm,    setShowAddForm]    = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState(null)

  const goals = useMemo(() => loadAllGoals(), [])

  const handleAddTask = useCallback((data) => {
    addTask(data)
    setShowAddForm(false)
  }, [addTask])

  const handleTabSwitch = useCallback((id) => {
    setActiveScopeTab(id)
    setShowAddForm(false)
  }, [setActiveScopeTab])

  const handleGoalSelect = useCallback((id) => {
    setSelectedGoalId(id)
    setShowAddForm(false)
  }, [])

  // ── Goal view data ───────────────────────────────────────────
  const selectedGoal = selectedGoalId ? goals.find(g => g.id === selectedGoalId) : null

  const goalViewTasks = useMemo(() => {
    if (!selectedGoalId) return []
    return [...tasks]
      .filter(t => t.goalRef === selectedGoalId)
      .sort((a, b) => {
        // Sort by due date (nulls last), then by horizon
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate)
        if (a.dueDate) return -1
        if (b.dueDate) return 1
        return (HORIZON_ORDER[a.horizon] ?? 99) - (HORIZON_ORDER[b.horizon] ?? 99)
      })
  }, [selectedGoalId, tasks])

  const goalViewSuggestions = useMemo(() => {
    if (!selectedGoalId) return []
    return suggestions.filter(s => s.goalRef === selectedGoalId)
  }, [selectedGoalId, suggestions])

  // ── Normal scope view data ───────────────────────────────────
  const scopeTasks       = filterTasksByScope(tasks, activeScopeTab)
  const scopeSuggestions = activeScopeTab === 'today'
    ? []
    : suggestions.filter(s => s.horizon === activeScopeTab)
  const grouped = groupByGoal(scopeTasks, scopeSuggestions)
  const hasContent = grouped.length > 0

  const goalsWithTasks = useMemo(() => {
    const refs = new Set([
      ...tasks.map(t => t.goalRef),
      ...suggestions.map(s => s.goalRef),
    ])
    return goals.filter(g => refs.has(g.id))
  }, [goals, tasks, suggestions])

  return (
    <>
      <div className="sec-hdr">
        <span className="sec-title">Priority Tasks</span>
        <span className="sec-action" onClick={() => setShowAddForm(s => !s)}>
          {showAddForm ? 'Cancel' : '+ Add Task'}
        </span>
      </div>

      {/* Goal filter dropdown */}
      {goalsWithTasks.length > 0 && (
        <select
          className="goal-filter-select"
          value={selectedGoalId ?? ''}
          onChange={e => handleGoalSelect(e.target.value || null)}
        >
          <option value="">All goals</option>
          {goalsWithTasks.map(g => (
            <option key={g.id} value={g.id}>
              {g.horizon.charAt(0).toUpperCase() + g.horizon.slice(1)}: {g.title}
            </option>
          ))}
        </select>
      )}

      {/* Scope tabs — hidden when a goal is selected */}
      {!selectedGoalId && (
        <div className="scope-tabs">
          {SCOPE_TABS.map(tab => (
            <button
              key={tab.id}
              className={`stab${activeScopeTab === tab.id ? ' active' : ''}`}
              onClick={() => handleTabSwitch(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {showAddForm && (
        <AddTaskForm
          defaultHorizon={selectedGoalId ? 'weekly' : activeScopeTab}
          onSave={handleAddTask}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* ── Goal view ── */}
      {selectedGoal ? (
        <>
          <GoalViewHeader goal={selectedGoal} tasks={goalViewTasks} />

          <div className="card">
            {goalViewTasks.length === 0 && goalViewSuggestions.length === 0 ? (
              <div className="tasks-empty">
                No tasks for this goal yet. Add one above or refresh suggestions.
              </div>
            ) : (
              <>
                {goalViewTasks.map(t => (
                  <GoalTaskItem
                    key={t.id}
                    task={t}
                    onToggle={toggleDone}
                    onDelete={deleteTask}
                    onUpdate={updateTask}
                  />
                ))}
                {goalViewSuggestions.length > 0 && (
                  <div className="suggestions-block">
                    {goalViewSuggestions.map(s => (
                      <SuggestionItem
                        key={s.id}
                        s={s}
                        onAccept={acceptSuggestion}
                        onDismiss={dismissSuggestion}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <button
            className="task-generate-btn"
            onClick={generating ? undefined : generateSuggestions}
            disabled={generating}
          >
            <RefreshIcon />
            {generating ? 'Generating suggestions…' : 'Refresh Suggestions'}
          </button>
          {generateError && (
            <p style={{ fontSize: 12, color: 'var(--terra)', marginTop: 6, textAlign: 'center' }}>
              {generateError}
            </p>
          )}
        </>
      ) : (
        /* ── Normal scope view ── */
        <>
          <div className="card">
            {hasContent ? (
              grouped.map(([key, group]) => (
                <GoalGroup
                  key={key}
                  goalKey={key}
                  goalTitle={group.goalTitle}
                  tasks={group.tasks}
                  suggestions={group.suggestions}
                  onToggle={toggleDone}
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                  onAccept={acceptSuggestion}
                  onDismiss={dismissSuggestion}
                />
              ))
            ) : (
              <div className="tasks-empty">
                {activeScopeTab === 'today'
                  ? 'No tasks for today. Add one above or check Weekly.'
                  : generating
                  ? 'Generating suggestions…'
                  : 'No tasks yet. Add one above or refresh suggestions.'
                }
              </div>
            )}
          </div>

          {activeScopeTab !== 'today' && (
            <>
              <button
                className="task-generate-btn"
                onClick={generating ? undefined : generateSuggestions}
                disabled={generating}
              >
                <RefreshIcon />
                {generating ? 'Generating suggestions…' : 'Refresh Suggestions'}
              </button>
              {generateError && (
                <p style={{ fontSize: 12, color: 'var(--terra)', marginTop: 6, textAlign: 'center' }}>
                  {generateError}
                </p>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}
