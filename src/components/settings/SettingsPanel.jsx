import { useEffect } from 'react'
import { useHub } from '../../context/HubContext'

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

function GoalsTab() {
  const HORIZONS = [
    {
      label: 'Quarterly · Q2 2025', key: 'quarterly',
      goals: [
        { title: 'Launch AI Attribution Framework for performance marketing clients', status: 'On track', statusClass: 'status-on-track', metric: 'Framework live and tested with 2 clients by June 30', progress: 42 },
        { title: 'Build and ship Morning Hub v1 as a working PWA', status: 'On track', statusClass: 'status-on-track', metric: 'Live on Vercel, daily active use by end of Q2', progress: 28 },
      ],
    },
    {
      label: 'Monthly · May 2025', key: 'monthly',
      goals: [
        { title: 'Complete competitive benchmarking report for Q2 review', status: 'At risk', statusClass: 'status-at-risk', metric: 'Delivered to leadership by May 31', progress: 55, terra: true },
      ],
    },
    {
      label: 'Weekly · May 19–25', key: 'weekly',
      goals: [
        { title: 'Close the Meridian campaign review and lock next sprint', status: 'On track', statusClass: 'status-on-track', metric: 'Client sign-off by EOW', progress: 70 },
      ],
    },
  ]

  return (
    <div>
      {HORIZONS.map(h => (
        <div key={h.key} className="horizon-block">
          <div className="horizon-label">
            {h.label}
            <span>+ Add goal</span>
          </div>
          {h.goals.map(g => (
            <div key={g.title} className="goal-card">
              <div className="goal-card-top">
                <div className="goal-card-title">{g.title}</div>
                <span className={`goal-status ${g.statusClass}`}>{g.status}</span>
              </div>
              <div className="goal-metric">Success metric: {g.metric}</div>
              <div className="goal-progress-bar">
                <div className={`goal-progress-fill${g.terra ? ' terra' : ''}`} style={{ width: `${g.progress}%` }} />
              </div>
              <div className="goal-card-actions">
                <button className="goal-action-btn">Edit</button>
                {!g.terra && <button className="goal-action-btn">Add milestone</button>}
                <button className="goal-action-btn primary">Ask Claude to assess</button>
              </div>
            </div>
          ))}
          <button className="add-goal-btn">
            <PlusIcon /> Add {h.key} goal
          </button>
        </div>
      ))}
    </div>
  )
}

function ContextTab() {
  return (
    <div>
      <p className="context-intro">This is what Claude reads before every briefing. Be direct — the more specific you are, the better the prioritization.</p>

      <label className="context-field-label">Role &amp; current focus</label>
      <textarea className="context-textarea" rows="3" defaultValue="VP of Performance Marketing. Currently leading two workstreams: AI attribution framework (client-facing) and Morning Hub product build (personal). Primary clients are Meridian Health and two mid-market e-commerce brands." />

      <label className="context-field-label">Active projects</label>
      <textarea className="context-textarea" rows="4" defaultValue={`1. Meridian Health Q2 Campaign — In review, deck pending client sign-off\n2. AI Attribution Framework — Dev brief in progress, targeting June launch\n3. Benchmarking Report — Section 3 incomplete, at risk for May 31\n4. Morning Hub PWA — Design mockup complete, moving to React build`} />

      <label className="context-field-label">Key people</label>
      <textarea className="context-textarea" rows="3" defaultValue={`Marcus — direct report, owns creative reporting and weekly standup\nJordan — performance team, flags data anomalies\nSarah — sister, birthday June 3rd`} />

      <label className="context-field-label">Working style &amp; constraints</label>
      <textarea className="context-textarea" rows="3" defaultValue="Deep work before 10am. Don't schedule anything before 8:30. Friday afternoons protected for reading and planning. Cubs season — check home game schedule before Monday meetings." />

      <label className="context-field-label">What Claude should always flag</label>
      <div className="context-tag-row">
        {['Deadline conflicts', 'Unprepped client meetings', 'Missing agendas', 'Personal dates approaching'].map(tag => (
          <span key={tag} className="context-tag">{tag} <span className="tag-x">×</span></span>
        ))}
        <span className="context-tag">+ Add flag</span>
      </div>
      <p className="context-hint">These appear as orange flags on your daily briefing.</p>
    </div>
  )
}

function PrefsTab() {
  return (
    <div>
      <label className="context-field-label">News topics &amp; follows</label>
      <div className="context-tag-row">
        {['AI & LLMs', 'Performance marketing', 'Chicago', 'Economy', 'Cubs', 'Ethan Mollick', 'Lenny Rachitsky'].map(tag => (
          <span key={tag} className="context-tag">{tag} <span className="tag-x">×</span></span>
        ))}
        <span className="context-tag">+ Add topic</span>
      </div>

      <label className="context-field-label" style={{ marginTop: 24 }}>Location</label>
      <input className="context-input" type="text" defaultValue="Lincoln Park, Chicago, IL" />

      <label className="context-field-label">Wake time (for briefing tone)</label>
      <input className="context-input" type="text" defaultValue="6:30 AM" />

      <label className="context-field-label">Morning Hub greeting style</label>
      <div className="context-tag-row" style={{ marginTop: 6 }}>
        <span className="context-tag" style={{ background: 'rgba(30,30,30,0.88)', color: '#fff', borderColor: 'transparent' }}>Concise</span>
        <span className="context-tag">Warm</span>
        <span className="context-tag">Detailed</span>
      </div>
      <p className="context-hint">Controls how much Claude writes in your morning greeting and meeting prep notes.</p>
    </div>
  )
}

const SP_TABS = [
  { id: 'goals',   label: 'Goals' },
  { id: 'context', label: 'Context' },
  { id: 'prefs',   label: 'Preferences' },
]

export default function SettingsPanel() {
  const { settingsOpen, closeSettings, activeSpTab, setActiveSpTab } = useHub()

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') closeSettings() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeSettings])

  return (
    <>
      <div className={`settings-backdrop${settingsOpen ? ' open' : ''}`} onClick={closeSettings} />
      <div className={`settings-panel${settingsOpen ? ' open' : ''}`}>
        <div className="sp-header">
          <div className="sp-title-group">
            <span className="sp-script">configure</span>
            <h2 className="sp-title">Goals &amp; <em>Context</em></h2>
          </div>
          <button className="sp-close" onClick={closeSettings}><XIcon /></button>
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
            <GoalsTab />
          </div>
          <div className={`sp-section${activeSpTab === 'context' ? ' active' : ''}`}>
            <ContextTab />
          </div>
          <div className={`sp-section${activeSpTab === 'prefs' ? ' active' : ''}`}>
            <PrefsTab />
          </div>
        </div>

        <div className="sp-footer">
          <button className="sp-cancel-btn" onClick={closeSettings}>Cancel</button>
          <button className="sp-save-btn">Save &amp; Update Briefing</button>
        </div>
      </div>
    </>
  )
}
