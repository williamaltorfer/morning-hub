import { useHub } from '../../context/HubContext'

// ── Icons ────────────────────────────────────────────────────

function CakeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
      <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
      <path d="M2 21h20"/>
      <path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/>
      <path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--stone-light)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

// ── Upcoming event type config ───────────────────────────────

const TYPE_CONFIG = {
  flight:      { label: 'Flight',      cls: 'pri-hi'  },
  hotel:       { label: 'Hotel',       cls: 'pri-med' },
  trip:        { label: 'Trip',        cls: 'pri-med' },
  appointment: { label: 'Appointment', cls: 'pri-med' },
  conference:  { label: 'Conference',  cls: 'pri-med' },
  allday:      { label: 'All Day',     cls: 'pri-lo'  },
  event:       { label: 'Event',       cls: 'pri-lo'  },
}

// ── Helpers ──────────────────────────────────────────────────

function isAnniversary(name) {
  return /anniversary/i.test(name)
}

function daysLabel(n) {
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  return `In ${n} day${n !== 1 ? 's' : ''}`
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

// ── Special event card ───────────────────────────────────────

function SpecialEventCard({ event }) {
  const anniversary = isAnniversary(event.name)
  const urgent      = event.daysAway <= 3

  return (
    <div className="gift-card">
      <div className="gift-icon" style={anniversary ? { background: 'var(--sage)' } : {}}>
        {anniversary ? <HeartIcon /> : <CakeIcon />}
      </div>
      <div className="gift-body">
        <div className="gift-title">{event.name}</div>
        <div className="gift-sub">
          <span style={urgent ? { color: 'var(--terra)', fontWeight: 500 } : {}}>
            {daysLabel(event.daysAway)}
          </span>
          {' · '}{fmtDate(event.dateStr)}
        </div>
      </div>
    </div>
  )
}

// ── Main section ─────────────────────────────────────────────

function UpcomingItem({ event, last }) {
  const cfg     = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.event
  const urgent  = event.daysAway <= 1

  const metaParts = [
    daysLabel(event.daysAway),
    fmtDate(event.dateStr),
    event.duration > 1 ? `${event.duration} days` : null,
    event.location  || null,
  ].filter(Boolean)

  return (
    <div className="todo-item" style={last ? { borderBottom: 'none' } : {}}>
      <div className="t-body">
        <div className="t-task">{event.name}</div>
        <div className="t-meta">
          <span
            className="t-due"
            style={urgent ? { color: 'var(--terra)', fontWeight: 500 } : {}}
          >
            {metaParts.join(' · ')}
          </span>
          <span className={`t-pri ${cfg.cls}`}>{cfg.label}</span>
        </div>
      </div>
    </div>
  )
}

export default function LifeSection() {
  const { calendar } = useHub()
  const { specialEvents, upcomingEvents, connected, loading } = calendar

  return (
    <>
      <div className="sec-hdr">
        <span className="sec-title">Personal</span>
      </div>

      <div className="card">
        {!connected && !loading && (
          <div className="special-empty">
            <CalendarIcon />
            <p>Connect Google Calendar to surface upcoming birthdays and anniversaries.</p>
          </div>
        )}

        {connected && loading && (
          <div className="special-empty">
            <p style={{ fontStyle: 'italic' }}>Checking calendar…</p>
          </div>
        )}

        {connected && !loading && specialEvents.length === 0 && (
          <div className="special-empty">
            <CalendarIcon />
            <p>No birthdays or anniversaries in the next 2 weeks.</p>
          </div>
        )}

        {connected && specialEvents.map(e => (
          <SpecialEventCard key={e.id} event={e} />
        ))}
      </div>

      <div className="sec-hdr">
        <span className="sec-title">Upcoming</span>
      </div>
      <div className="card">
        {!connected && !loading && (
          <div className="special-empty">
            <CalendarIcon />
            <p>Connect Google Calendar to see upcoming appointments, flights, and events.</p>
          </div>
        )}

        {connected && loading && (
          <div className="special-empty">
            <p style={{ fontStyle: 'italic' }}>Checking calendar…</p>
          </div>
        )}

        {connected && !loading && upcomingEvents.length === 0 && (
          <div className="special-empty">
            <CalendarIcon />
            <p>No upcoming appointments, trips, or full-day events in the next 2 weeks.</p>
          </div>
        )}

        {connected && !loading && upcomingEvents.map((e, i) => (
          <UpcomingItem
            key={e.id}
            event={e}
            last={i === upcomingEvents.length - 1}
          />
        ))}
      </div>
    </>
  )
}
