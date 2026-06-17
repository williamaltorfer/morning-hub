import { useState, useRef, useEffect } from 'react'
import { useHub } from '../../context/HubContext'
import VoiceBar from './VoiceBar'
import DayColumn from '../day/DayColumn'
import TasksSection from '../tasks/TasksSection'
import LifeSection from '../life/LifeSection'
import FeedColumn from '../feed/FeedColumn'

function GearIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--stone)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}

const NAV_TABS = [
  {
    id: 'day', label: 'Day',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--terra)' : 'var(--stone-light)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    ),
  },
  {
    id: 'tasks', label: 'Tasks',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--terra)' : 'var(--stone-light)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    id: 'life', label: 'Life',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--terra)' : 'var(--stone-light)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    id: 'feed', label: 'Feed',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--terra)' : 'var(--stone-light)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
        <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
      </svg>
    ),
  },
]

export default function MobileLayout() {
  const { openSettings } = useHub()
  const [activeTab, setActiveTab] = useState('day')
  const [mini, setMini] = useState(false)
  const scrollRef = useRef(null)
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    function tick() {
      const d = new Date()
      let h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0')
      const ap = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      setTimeStr(`${h}:${m} ${ap}`)
      setDateStr(d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  let ticking = false
  function handleScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const top = scrollRef.current?.scrollTop ?? 0
        setMini(top > 40)
        ticking = false
      })
      ticking = true
    }
  }

  function switchTab(id) {
    setActiveTab(id)
    setMini(false)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }

  return (
    <>
      <div className={`sticky-top${mini ? ' scrolled' : ''}`}>
        <header className={`hub-header${mini ? ' mini' : ''}`}>
          <div className="hdr-full-content">
            <div className="header-top">
              <div>
                <span className="brand-script">good morning</span>
                <h1 className="brand-title">Morning <em>Hub</em></h1>
              </div>
              <div className="header-right">
                <div className="hdr-date">{dateStr}</div>
                <div className="hdr-time">{timeStr} · Chicago</div>
              </div>
            </div>
            <div className="hdr-greeting">You have a full day ahead — let's make it count.</div>
          </div>
          <div className="hdr-mini-content">
            <span className="mini-brand">Morning <em>Hub</em></span>
            <div className="mini-right">
              <span className="mini-time">{timeStr}</span>
              <button className="settings-btn" onClick={openSettings} style={{ width: 28, height: 28 }} title="Settings">
                <GearIcon />
              </button>
              <button className="mini-voice-btn"><MicIcon /></button>
            </div>
          </div>
        </header>
        <VoiceBar hidden={mini} />
      </div>

      <div className="scroll-area" ref={scrollRef} onScroll={handleScroll}>
        <div className={`tab-section${activeTab === 'day' ? ' active' : ''}`} id="tab-day">
          <DayColumn />
        </div>
        <div className={`tab-section${activeTab === 'tasks' ? ' active' : ''}`} id="tab-tasks">
          <TasksSection />
        </div>
        <div className={`tab-section${activeTab === 'life' ? ' active' : ''}`} id="tab-life">
          <LifeSection />
        </div>
        <div className={`tab-section${activeTab === 'feed' ? ' active' : ''}`} id="tab-feed">
          <div className="sec-hdr"><span className="sec-title">Curated Feed</span><span className="sec-action">Manage</span></div>
          <FeedColumn />
        </div>
        <div style={{ height: 8 }} />
      </div>

      <nav className="bottom-nav">
        {NAV_TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => switchTab(tab.id)}
          >
            <div className="nav-icon-wrap">{tab.icon(activeTab === tab.id)}</div>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
