import { useState } from 'react'

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}

export default function VoiceBar({ hidden = false }) {
  const [listening, setListening] = useState(false)

  function activate() {
    setListening(true)
    setTimeout(() => setListening(false), 2500)
  }

  return (
    <div className={`voice-bar${hidden ? ' hidden' : ''}`}>
      <button
        className="voice-btn"
        onClick={activate}
        style={listening ? { background: 'var(--terra-light)' } : {}}
      >
        <MicIcon />
      </button>
      <div className="voice-text">
        {listening
          ? <span>Listening…</span>
          : <>Ask anything — <span>"What do I need to prep for my 10am?"</span> · <span>"Order Sarah a birthday gift"</span> · <span>"Add milk to my grocery list"</span></>
        }
      </div>
      <div className="voice-wave">
        <i/><i/><i/><i/><i/><i/><i/>
      </div>
    </div>
  )
}
