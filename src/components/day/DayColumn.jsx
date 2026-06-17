import { useState } from 'react'
import useWeather from '../../hooks/useWeather'
import { useHub } from '../../context/HubContext'

const S = 'rgba(255,255,255,.85)'

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function RainIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/>
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
    </svg>
  )
}

function SnowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="22" y2="12"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/>
    </svg>
  )
}

function ThunderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}

function WeatherIcon({ type }) {
  switch (type) {
    case 'sun':     return <SunIcon />
    case 'cloud':   return <CloudIcon />
    case 'moon':    return <MoonIcon />
    case 'rain':    return <RainIcon />
    case 'snow':    return <SnowIcon />
    case 'thunder': return <ThunderIcon />
    default:        return <SunIcon />
  }
}


function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function MeetingItem({ meeting }) {
  const [open, setOpen] = useState(false)
  const cls = ['meeting-item', meeting.variant, open ? 'open' : ''].filter(Boolean).join(' ')

  return (
    <div className={cls} onClick={() => setOpen(o => !o)}>
      <div className="meeting-body">
        <div className="meet-row1">
          <span className="meet-name">{meeting.name}</span>
          <span className="meet-time">{meeting.timeLabel}</span>
        </div>
        {meeting.sub && <div className="meet-sub">{meeting.sub}</div>}
        {meeting.flag && (
          <div className={`meet-flag ${meeting.flag.type}`}>
            {meeting.flag.icon} {meeting.flag.text}
          </div>
        )}
      </div>
      <div className="meet-drawer">
        <div className="drawer-label">{meeting.drawerLabel}</div>
        <div className="drawer-text">{meeting.drawerText}</div>
        {meeting.actions.length > 0 && (
          <div className="drawer-actions">
            {meeting.actions.map(a => (
              <button
                key={a.label}
                className={`dbtn${a.primary ? ' primary' : ''}`}
                onClick={e => { e.stopPropagation(); if (a.url) window.open(a.url, '_blank') }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ScheduleSection() {
  const { calendar } = useHub()
  const { events, loading, connecting, connected, signIn } = calendar
  const now = Date.now()
  const past     = events.filter(e => new Date(e.endIso).getTime() < now)
  const upcoming = events.filter(e => new Date(e.endIso).getTime() >= now)
  const count = events.length

  return (
    <>
      <div className="sec-hdr">
        <span className="sec-title">Today's Schedule</span>
        {connected && <span className="sec-action" onClick={calendar.signOut}>Disconnect</span>}
      </div>

      {!connected && (
        <div className="cal-connect">
          <CalendarIcon />
          <div className="cal-connect-text">
            <span className="cal-connect-label">Connect Google Calendar</span>
            <span className="cal-connect-sub">Your schedule will appear here</span>
          </div>
          <button className="cal-connect-btn" onClick={signIn} disabled={connecting}>
            {connecting ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      )}

      {connected && loading && (
        <div className="cal-loading">
          <div className="cal-skeleton" /><div className="cal-skeleton" /><div className="cal-skeleton short" />
        </div>
      )}

      {connected && !loading && (
        <>
          <div className="day-summary-bar">
            {count === 0
              ? 'No events scheduled today'
              : `${count} event${count !== 1 ? 's' : ''} today`}
          </div>
          <div style={{ height: 10 }} />
          {past.map(m => <MeetingItem key={m.id} meeting={m} />)}
          {upcoming.length > 0 && (
            <div className="now-line">
              <span className="now-label">Now</span>
              <div className="now-rule" />
              <div className="now-dot" />
            </div>
          )}
          {upcoming.map(m => <MeetingItem key={m.id} meeting={m} />)}
          {count === 0 && (
            <div className="cal-empty">Clear calendar — enjoy the breathing room.</div>
          )}
        </>
      )}
    </>
  )
}

function WeatherCard() {
  const { loading, error, data } = useWeather()

  if (loading) {
    return <div className="weather-card weather-card--loading" aria-busy="true" />
  }

  if (error || !data) {
    return (
      <div className="weather-card">
        <div className="weather-top">
          <div className="w-right" style={{ padding: '20px' }}>
            <div className="w-condition">Weather unavailable</div>
            <div className="w-loc">Chicago · Lincoln Park</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="weather-card">
      <div className="weather-top">
        <div className="w-temp">{data.temp}<sup>°</sup></div>
        <div className="w-right">
          <div className="w-condition">{data.condition}</div>
          <div className="w-loc">{data.location}</div>
        </div>
      </div>
      <div className="w-stats">
        <span>H {data.high}°</span>
        <span>L {data.low}°</span>
        <span>Wind {data.wind} mph</span>
        <span>Rain {data.rain}%</span>
      </div>
      <div className="w-hourly">
        {data.hourly.map(h => (
          <div key={h.label} className="w-hour">
            <div className="wh-time">{h.label}</div>
            <div className="wh-icon"><WeatherIcon type={h.iconType} /></div>
            <div className="wh-temp">{h.temp}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DayColumn() {
  return (
    <>
      <div className="desktop-col-header">
        <span className="desktop-col-title"><em>Day</em></span>
      </div>

      <WeatherCard />

      <ScheduleSection />
    </>
  )
}
