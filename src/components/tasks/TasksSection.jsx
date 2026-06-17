import { useState, useCallback } from 'react'
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

function filterTasksByScope(tasks, scope) {
  switch (scope) {
    case 'today':
      return tasks.filter(t =>
        t.horizon === 'today' ||
        isToday(t.dueDate) ||
        (!t.done && t.dueDate && isOverdue(t.dueDate))
      )
    case 'weekly':
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

// ── Icons ────────────────────────────────────────────────────

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

function TaskItem({ task, onToggle, onDelete }) {
  const due     = fmtDue(task.dueDate)
  const overdue = !task.done && task.dueDate && isOverdue(task.dueDate) && !isToday(task.dueDate)

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
          {due && (
            <span className="t-due" style={overdue ? { color: 'var(--terra)' } : {}}>
              {due}
            </span>
          )}
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

function GoalGroup({ goalKey, goalTitle, tasks, suggestions, onToggle, onDelete, onAccept, onDismiss }) {
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

// ── Main Section ─────────────────────────────────────────────

export default function TasksSection() {
  const { activeScopeTab, setActiveScopeTab } = useHub()
  const {
    tasks, suggestions, generating,
    addTask, toggleDone, deleteTask,
    acceptSuggestion, dismissSuggestion, generateSuggestions,
  } = useTasks()

  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddTask = useCallback((data) => {
    addTask(data)
    setShowAddForm(false)
  }, [addTask])

  const handleTabSwitch = useCallback((id) => {
    setActiveScopeTab(id)
    setShowAddForm(false)
  }, [setActiveScopeTab])

  const scopeTasks       = filterTasksByScope(tasks, activeScopeTab)
  const scopeSuggestions = activeScopeTab === 'today'
    ? []
    : suggestions.filter(s => s.horizon === activeScopeTab)

  const grouped = groupByGoal(scopeTasks, scopeSuggestions)

  const hasContent = grouped.length > 0

  return (
    <>
      <div className="sec-hdr">
        <span className="sec-title">Priority Tasks</span>
        <span
          className="sec-action"
          onClick={() => setShowAddForm(s => !s)}
        >
          {showAddForm ? 'Cancel' : '+ Add Task'}
        </span>
      </div>

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

      {showAddForm && (
        <AddTaskForm
          defaultHorizon={activeScopeTab}
          onSave={handleAddTask}
          onCancel={() => setShowAddForm(false)}
        />
      )}

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
        <button
          className="task-generate-btn"
          onClick={generating ? undefined : generateSuggestions}
          disabled={generating}
        >
          <RefreshIcon />
          {generating ? 'Generating suggestions…' : 'Refresh Suggestions'}
        </button>
      )}
    </>
  )
}
