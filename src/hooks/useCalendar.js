import { useCallback, useEffect, useRef, useState } from 'react'

const TOKEN_KEY = 'gcal_token'
const SCOPE     = 'https://www.googleapis.com/auth/calendar.readonly'

function loadStoredToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const { access_token, expires_at } = JSON.parse(raw)
    if (Date.now() > expires_at - 60_000) return null
    return access_token
  } catch { return null }
}

function saveToken(resp) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify({
    access_token: resp.access_token,
    expires_at:   Date.now() + resp.expires_in * 1000,
  }))
}

// ── Time formatting ──────────────────────────────────────────

function fmtTime(dt) {
  const h  = dt.getHours()
  const m  = dt.getMinutes()
  const h12 = h % 12 || 12
  return m === 0 ? `${h12}` : `${h12}:${String(m).padStart(2, '0')}`
}

function fmtRange(startDt, endDt) {
  const sAP = startDt.getHours() < 12 ? 'AM' : 'PM'
  const eAP = endDt.getHours()   < 12 ? 'AM' : 'PM'
  return sAP === eAP
    ? `${fmtTime(startDt)}–${fmtTime(endDt)} ${eAP}`
    : `${fmtTime(startDt)} ${sAP}–${fmtTime(endDt)} ${eAP}`
}

// ── Event mapping ────────────────────────────────────────────

function mapEvent(event) {
  const isAllDay = !event.start.dateTime
  const startIso = event.start.dateTime || event.start.date
  const endIso   = event.end.dateTime   || event.end.date
  const startDt  = new Date(startIso)
  const endDt    = new Date(endIso)
  const isPast   = endDt < new Date()

  const timeLabel = isAllDay ? 'All day' : fmtRange(startDt, endDt)

  // Sub line: video conference > location > organizer
  let sub = ''
  const confName = event.conferenceData?.conferenceSolution?.name
  if (confName) {
    sub = confName
  } else if (event.location) {
    sub = event.location.split(',').slice(0, 2).join(',').trim()
  } else if (event.organizer?.displayName) {
    sub = event.organizer.displayName
  }

  const actions = []
  if (event.hangoutLink) {
    actions.push({ label: 'Join Meet', url: event.hangoutLink, primary: true })
  }
  if (event.location) {
    actions.push({ label: 'Directions', url: `https://maps.google.com/?q=${encodeURIComponent(event.location)}` })
  }

  const description = event.description
    ? event.description.replace(/<[^>]*>/g, '').trim().slice(0, 300)
    : ''

  return {
    id:          event.id,
    name:        event.summary || '(No title)',
    timeLabel,
    sub,
    variant:     isPast ? 'past' : '',
    flag:        null,
    drawerLabel: description ? 'Description' : 'Details',
    drawerText:  description || timeLabel,
    actions,
    isPast,
    isAllDay,
    startIso,
    endIso,
  }
}

// ── API fetch ────────────────────────────────────────────────

async function fetchEvents(accessToken) {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end   = new Date(); end.setHours(23, 59, 59, 999)

  const params = new URLSearchParams({
    timeMin:       start.toISOString(),
    timeMax:       end.toISOString(),
    singleEvents:  'true',
    orderBy:       'startTime',
    maxResults:    '20',
  })

  const resp = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!resp.ok) {
    const err = new Error(`Calendar API ${resp.status}`)
    err.status = resp.status
    throw err
  }

  const json = await resp.json()
  return (json.items || []).map(mapEvent)
}

// ── Hook ─────────────────────────────────────────────────────

export default function useCalendar() {
  const [token,      setToken]      = useState(() => loadStoredToken())
  const [events,     setEvents]     = useState([])
  const [loading,    setLoading]    = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error,      setError]      = useState(null)
  const clientRef = useRef(null)

  // Initialize GIS token client (script is async-deferred)
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) return

    const init = () => {
      clientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope:     SCOPE,
        callback:  (resp) => {
          setConnecting(false)
          if (resp.error) { setError(resp.error); return }
          saveToken(resp)
          setToken(resp.access_token)
        },
      })
    }

    if (window.google?.accounts) {
      init()
    } else {
      const id = setInterval(() => {
        if (window.google?.accounts) { clearInterval(id); init() }
      }, 100)
      return () => clearInterval(id)
    }
  }, [])

  // Fetch events whenever token is set
  useEffect(() => {
    if (!token) return
    setLoading(true)
    setError(null)
    fetchEvents(token)
      .then(setEvents)
      .catch(err => {
        if (err.status === 401) {
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
        }
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [token])

  const signIn = useCallback(() => {
    setConnecting(true)
    clientRef.current?.requestAccessToken()
  }, [])

  const signOut = useCallback(() => {
    if (token) window.google?.accounts.oauth2.revoke(token, () => {})
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setEvents([])
  }, [token])

  return {
    events,
    loading,
    connecting,
    error,
    connected: !!token,
    signIn,
    signOut,
  }
}
