import { useState, useEffect } from 'react'
import { useHub } from '../../context/HubContext'

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--stone)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function MicIcon({ color = '#fff' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}

export default function Header() {
  const { openSettings, briefing } = useHub()
  const greeting = briefing.briefing?.greeting ?? (briefing.loading ? '' : 'You have a full day ahead — let\'s make it count.')
  const [dateStr, setDateStr] = useState('')
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    function tick() {
      const d = new Date()
      let h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0')
      const ap = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      setTimeStr(`${h}:${m} ${ap} · Chicago`)
      setDateStr(d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="desktop-header">
      <div className="dh-left">
        <span className="dh-script">good morning</span>
        <h1 className="dh-title">Morning <em>Hub</em></h1>
      </div>
      <div className="dh-center">
        <span className="dh-greeting">{greeting}</span>
      </div>
      <div className="dh-right">
        <div className="dh-date">
          <div className="dh-date-main">{dateStr}</div>
          <div className="dh-time-str">{timeStr}</div>
        </div>
        <button className="settings-btn" onClick={openSettings} title="Goals & Context">
          <GearIcon />
        </button>
        <button className="dh-voice-btn">
          <MicIcon />
        </button>
      </div>
    </header>
  )
}
