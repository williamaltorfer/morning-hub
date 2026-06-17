import { useState } from 'react'
import { useHub } from '../../context/HubContext'

const SCOPE_TABS = ['Today', 'Weekly', 'Monthly', 'Q2']

const TASKS = [
  { goalLabel: 'Q2 Goal — AI Attribution Framework', items: [
    { text: 'Send Meridian pre-read deck for 10am', due: 'Due 9:30 AM', pri: 'Critical', priClass: 'pri-hi', done: true },
    { text: 'Draft AI model brief for dev hand-off',   due: 'Due Fri May 29', pri: 'High', priClass: 'pri-hi' },
    { text: "Review Marcus's OKR draft before 2pm 1:1", due: 'Before 2pm', pri: 'Medium', priClass: 'pri-med' },
  ]},
  { goalLabel: 'Monthly — Benchmarking Report', items: [
    { text: 'Pull May Google Ads export — CPL by campaign', due: 'Due May 28', pri: 'High', priClass: 'pri-hi' },
    { text: 'Finalize competitor ad spend analysis (Section 3)', due: 'Due June 3', pri: 'Medium', priClass: 'pri-med' },
  ]},
  { goalLabel: 'Weekly — Personal', items: [
    { text: "Order Sarah's birthday gift — June 3rd, 10 days away", due: 'Order today for delivery', pri: 'Urgent', priClass: 'pri-hi' },
    { text: '"Thinking in Bets" Ch. 4–6', due: 'This week', pri: 'Low', priClass: 'pri-lo' },
  ]},
]

function TaskItem({ task }) {
  const [done, setDone] = useState(task.done ?? false)
  return (
    <div className="todo-item" onClick={() => setDone(d => !d)}>
      <div className={`t-check${done ? ' done' : ''}`} />
      <div className="t-body">
        <div className={`t-task${done ? ' done' : ''}`}>{task.text}</div>
        <div className="t-meta">
          <span className="t-due">{task.due}</span>
          <span className={`t-pri ${task.priClass}`}>{task.pri}</span>
        </div>
      </div>
    </div>
  )
}

export default function TasksSection() {
  const { activeScopeTab, setActiveScopeTab } = useHub()

  return (
    <>
      <div className="sec-hdr" style={{ paddingLeft: 0, paddingTop: 0 }}>
        <span className="sec-title">Priority Tasks</span>
      </div>
      <div className="scope-tabs">
        {SCOPE_TABS.map(tab => (
          <button
            key={tab}
            className={`stab${activeScopeTab === tab.toLowerCase() ? ' active' : ''}`}
            onClick={() => setActiveScopeTab(tab.toLowerCase())}
          >{tab}</button>
        ))}
      </div>
      <div className="card">
        {TASKS.map(group => (
          <div key={group.goalLabel}>
            <div className="goal-label">{group.goalLabel}</div>
            {group.items.map(item => <TaskItem key={item.text} task={item} />)}
          </div>
        ))}
      </div>
    </>
  )
}
