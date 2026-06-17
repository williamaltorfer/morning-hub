import { useState } from 'react'
import useWeather from '../../hooks/useWeather'

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

function AlertIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}

const MEETINGS = [
  {
    name: 'Weekly Standup', time: '7:00–7:30 AM',
    sub: 'Performance Team · Completed — tap to review',
    variant: 'past',
    drawerLabel: 'Summary',
    drawerText: '"Q2 attribution discussed. Jordan flagged 12% drop in Meta ROAS week-over-week."',
    actions: [{ label: 'Play' }, { label: 'Transcript' }, { label: 'Ask Agent', primary: true }],
  },
  {
    name: 'Q2 Campaign Review', time: '10:00–11:00 AM',
    sub: 'Meridian Health · Zoom',
    variant: 'flagged',
    flag: { type: 'warn', icon: <AlertIcon />, text: 'Deck not shared yet' },
    drawerLabel: 'Suggested Prep',
    drawerText: '"Client will likely ask about CPL trends. Pull May report, creative performance tab ready."',
    actions: [{ label: 'Open Deck' }, { label: 'Join Zoom' }, { label: 'Ask Agent', primary: true }],
  },
  {
    name: 'Haircut · Aidan at FORM', time: '12:30 PM',
    sub: '1123 N Damen Ave · Personal',
    variant: '',
    flag: { type: 'info', icon: <ClockIcon />, text: 'Leave by 12:15' },
    drawerLabel: 'Getting There',
    drawerText: '"10 min drive from home. Street parking on Damen is usually open midday."',
    actions: [{ label: 'Directions' }, { label: 'Set Reminder', primary: true }],
  },
  {
    name: '1:1 with Marcus', time: '2:00–2:30 PM',
    sub: 'Direct Report · Google Meet',
    variant: 'flagged',
    flag: { type: 'warn', icon: <EditIcon />, text: 'No agenda set yet' },
    drawerLabel: 'Suggested Topics',
    drawerText: '"Q2 OKR check-in and the Meta ROAS drop from standup. Marcus owns creative reporting."',
    actions: [{ label: 'Add Agenda', primary: true }, { label: 'Join Meet' }],
  },
  {
    name: 'Cubs vs. Cardinals', time: '7:05 PM',
    sub: 'Wrigley Field · Section 228, Row 6',
    variant: 'personal',
    flag: { type: 'info', icon: <BoltIcon />, text: 'Leave by 6:15 · Cubs lead NL Central by 2' },
    drawerLabel: 'Tonight',
    drawerText: '"Sellout crowd expected. Blue Line to Addison is fastest. Gates open 5:35."',
    actions: [{ label: 'Transit' }, { label: 'Tickets' }],
  },
]

function MeetingItem({ meeting }) {
  const [open, setOpen] = useState(false)
  const cls = ['meeting-item', meeting.variant, open ? 'open' : ''].filter(Boolean).join(' ')

  return (
    <div className={cls} onClick={() => setOpen(o => !o)}>
      <div className="meeting-body">
        <div className="meet-row1">
          <span className="meet-name">{meeting.name}</span>
          <span className="meet-time">{meeting.time}</span>
        </div>
        <div className="meet-sub">{meeting.sub}</div>
        {meeting.flag && (
          <div className={`meet-flag ${meeting.flag.type}`}>
            {meeting.flag.icon} {meeting.flag.text}
          </div>
        )}
      </div>
      <div className="meet-drawer">
        <div className="drawer-label">{meeting.drawerLabel}</div>
        <div className="drawer-text">{meeting.drawerText}</div>
        <div className="drawer-actions">
          {meeting.actions.map(a => (
            <button key={a.label} className={`dbtn${a.primary ? ' primary' : ''}`}
              onClick={e => e.stopPropagation()}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
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
        <span className="sec-action">+ Add</span>
      </div>

      <WeatherCard />

      <div className="sec-hdr"><span className="sec-title">Today's Schedule</span><span className="sec-action">+ Add</span></div>
      <div className="day-summary-bar">5 events · Cubs game tonight at 7:05 · Busiest window 9–11am</div>
      <div style={{ height: 10 }} />

      {MEETINGS.slice(0, 1).map(m => <MeetingItem key={m.name} meeting={m} />)}
      <div className="now-line">
        <span className="now-label">Now</span>
        <div className="now-rule" />
        <div className="now-dot" />
      </div>
      {MEETINGS.slice(1).map(m => <MeetingItem key={m.name} meeting={m} />)}
    </>
  )
}
