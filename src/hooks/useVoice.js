import { useCallback, useRef, useState } from 'react'

const CONTEXT_KEY = 'morning_hub_context'

function loadContext() {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function buildVoicePrompt(context, briefingSummary, events) {
  const goals = context?.goals?.length
    ? context.goals.map(g => `${(g.horizon || '').toUpperCase()}: ${g.title} (${g.status})`).join('\n')
    : '(no goals configured)'

  const ctx = context?.context ?? {}
  const userCtx = [
    ctx.role     && `Role: ${ctx.role}`,
    ctx.projects && `Projects: ${ctx.projects}`,
  ].filter(Boolean).join('\n')

  const eventsText = events?.length
    ? events.map(e => `${e.timeLabel} — ${e.name}${e.sub ? ` (${e.sub})` : ''}`).join('\n')
    : '(no events today)'

  return `You are a voice assistant for a personal morning intelligence hub. Your response will be read aloud — use natural spoken sentences only. No bullet points, no markdown, no lists. Keep responses under 60 words. Be direct and specific to what was asked.

GOALS:
${goals}
${userCtx ? `\nUSER CONTEXT:\n${userCtx}\n` : ''}
TODAY'S SCHEDULE:
${eventsText}
${briefingSummary ? `\nMORNING SUMMARY: ${briefingSummary}` : ''}`
}

export default function useVoice({ events = [], briefing = null } = {}) {
  const [voiceState, setVoiceState] = useState('idle') // idle | listening | processing | speaking | error
  const [transcript, setTranscript] = useState('')
  const [response,   setResponse]   = useState('')

  const recogRef = useRef(null)
  const eventsRef  = useRef(events)
  const briefingRef = useRef(briefing)
  eventsRef.current  = events
  briefingRef.current = briefing

  const supported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const dismiss = useCallback(() => {
    recogRef.current?.abort()
    window.speechSynthesis?.cancel()
    setVoiceState('idle')
    setTranscript('')
    setResponse('')
  }, [])

  const start = useCallback(() => {
    if (!supported) return
    if (voiceState !== 'idle') { dismiss(); return }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recog = new SR()
    recog.lang = 'en-US'
    recog.continuous = false
    recog.interimResults = true
    recogRef.current = recog

    setVoiceState('listening')
    setTranscript('')
    setResponse('')

    let finalText = ''

    recog.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t
        else interim += t
      }
      setTranscript(finalText || interim)
    }

    recog.onend = async () => {
      const query = finalText.trim()
      if (!query) { setVoiceState('idle'); return }

      setVoiceState('processing')

      const context = loadContext()
      const summary = briefingRef.current?.summary ?? ''
      const system  = buildVoicePrompt(context, summary, eventsRef.current)

      try {
        const resp = await fetch('/api/briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model:      'claude-haiku-4-5-20251001',
            max_tokens: 200,
            system,
            messages:   [{ role: 'user', content: query }],
          }),
        })
        if (!resp.ok) throw new Error(`API ${resp.status}`)
        const data   = await resp.json()
        const answer = data.content?.[0]?.text?.trim() ?? 'Sorry, I could not process that.'

        setResponse(answer)
        setVoiceState('speaking')

        const utt = new SpeechSynthesisUtterance(answer)
        utt.rate  = 0.95
        utt.pitch = 1
        utt.onend   = () => setVoiceState('idle')
        utt.onerror = () => setVoiceState('idle')

        // iOS Safari pauses synthesis; resume it after a tick
        window.speechSynthesis.cancel()
        setTimeout(() => window.speechSynthesis.speak(utt), 50)
      } catch (err) {
        setResponse(err.message)
        setVoiceState('error')
      }
    }

    recog.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') {
        setVoiceState('idle')
        return
      }
      setResponse(`Microphone error: ${e.error}`)
      setVoiceState('error')
    }

    recog.start()
  }, [voiceState, supported, dismiss])

  return { voiceState, transcript, response, start, dismiss, supported }
}
