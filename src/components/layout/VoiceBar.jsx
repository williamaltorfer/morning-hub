import { useHub } from '../../context/HubContext'

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

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function WaveAnim() {
  return (
    <div className="voice-wave">
      <i/><i/><i/><i/><i/><i/><i/>
    </div>
  )
}

export default function VoiceBar({ hidden = false }) {
  const { voice } = useHub()
  const { voiceState, transcript, response, start, dismiss, supported } = voice

  if (!supported) return null

  const isActive = voiceState !== 'idle'
  const showWave = voiceState === 'listening' || voiceState === 'speaking'

  function handleBtn() {
    if (isActive) dismiss()
    else start()
  }

  return (
    <div className={`voice-bar${hidden ? ' hidden' : ''}`}>
      <button
        className={`voice-btn${voiceState === 'listening' ? ' listening' : ''}`}
        onClick={handleBtn}
        aria-label={isActive ? 'Stop' : 'Start voice'}
      >
        {isActive ? <StopIcon /> : <MicIcon />}
      </button>

      <div className="voice-text">
        {voiceState === 'idle' && (
          <>Ask anything — <span>"What do I need to prep for my 10am?"</span> · <span>"What should I focus on?"</span></>
        )}
        {voiceState === 'listening' && (
          <span>{transcript || 'Listening…'}</span>
        )}
        {voiceState === 'processing' && (
          <span>Processing…</span>
        )}
        {(voiceState === 'speaking' || voiceState === 'error') && (
          <span style={voiceState === 'error' ? { color: 'var(--terra)' } : {}}>{response}</span>
        )}
      </div>

      {showWave && <WaveAnim />}
    </div>
  )
}
