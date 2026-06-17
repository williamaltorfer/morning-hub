const MEALS = [
  { label: 'Breakfast', name: 'Avocado toast with soft egg',      tag: '~420 cal · 22g protein' },
  { label: 'Lunch',     name: 'Mediterranean grain bowl',          tag: '~580 cal · Quick · Post-haircut' },
  { label: 'Dinner',    name: "Wrigley hot dog — don't overthink it", tag: 'Cubs night, enjoy it' },
]

const REMINDERS = [
  { task: 'Annual physical — schedule before end of June',  meta: 'Dr. Keller · Northwestern',  pri: 'Reminder', priClass: 'pri-med' },
  { task: "Dad's flight lands June 7th — confirm pickup",   meta: "O'Hare · Terminal 3",         pri: 'Reminder', priClass: 'pri-med' },
  { task: "Renew renter's insurance — expires June 30",     meta: 'Auto-renewal off',             pri: 'Action needed', priClass: 'pri-hi', last: true },
]

function ShoppingBagIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  )
}

export default function LifeSection() {
  return (
    <>
      <div className="sec-hdr" style={{ paddingLeft: 0, paddingTop: 6 }}>
        <span className="sec-title">Meals Today</span>
        <span className="sec-action">Plan Week</span>
      </div>
      <div className="card">
        {MEALS.map(m => (
          <div key={m.label} className="meal-row">
            <div className="meal-label-col"><span className="meal-lbl">{m.label}</span></div>
            <div className="meal-content">
              <div className="meal-name">{m.name}</div>
              <div className="meal-tag">{m.tag}</div>
            </div>
          </div>
        ))}
      </div>

      <button className="outline-btn">
        <ShoppingBagIcon /> Generate Grocery List
      </button>

      <div className="sec-hdr" style={{ paddingLeft: 0, paddingTop: 6 }}>
        <span className="sec-title">Personal</span>
      </div>
      <div className="card">
        <div className="gift-card">
          <div className="gift-icon"><GiftIcon /></div>
          <div className="gift-body">
            <div className="gift-title">Sarah's Birthday — June 3rd</div>
            <div className="gift-sub">10 days away · Last year: Le Labo candle + Aesop skincare · Budget ~$120</div>
            <button className="gift-btn">Order Gift Now</button>
          </div>
        </div>
      </div>

      <div className="sec-hdr" style={{ paddingLeft: 0, paddingTop: 8 }}>
        <span className="sec-title">Upcoming</span>
      </div>
      <div className="card">
        {REMINDERS.map((r, i) => (
          <div key={r.task} className="todo-item" style={r.last ? { borderBottom: 'none' } : {}}>
            <div className="t-body">
              <div className="t-task">{r.task}</div>
              <div className="t-meta">
                <span className="t-due">{r.meta}</span>
                <span className={`t-pri ${r.priClass}`}>{r.pri}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
