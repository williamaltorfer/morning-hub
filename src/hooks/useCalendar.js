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

async function fetchEvents(accessToken, calendarIds = ['primary']) {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end   = new Date(); end.setHours(23, 59, 59, 999)

  const params = new URLSearchParams({
    timeMin:      start.toISOString(),
    timeMax:      end.toISOString(),
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '30',
  }).toString()

  const results = await Promise.allSettled(
    calendarIds.map(id => fetchCalendarItems(id, params, accessToken))
  )

  const seen = new Set()
  return results
    .flatMap(r => r.status === 'fulfilled' ? r.value : [])
    .filter(e => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })
    .map(mapEvent)
    .sort((a, b) => {
      if (!a.startIso) return 1
      if (!b.startIso) return -1
      return new Date(a.startIso) - new Date(b.startIso)
    })
}

const SPECIAL_RE  = /birthday|anniversary|bday/i
const UPCOMING_RE = /flight|airline|airport|hotel|airbnb|resort|appointment|appt|doctor|dentist|medical|physical|therapy|therapist|conference|summit|workshop|trip|travel|vacation|holiday|train|amtrak|visit|checkup|check.?up/i

async function fetchAllCalendars(accessToken) {
  try {
    const resp = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!resp.ok) return []
    const data = await resp.json()
    return (data.items || []).filter(c =>
      !c.hidden && c.accessRole !== 'freeBusyReader'
    ).map(c => ({
      id:      c.id,
      summary: c.summary || c.id,
      color:   c.backgroundColor || '#4A5C45',
      primary: !!c.primary,
      isBirthday: c.summary?.toLowerCase().includes('birthday') || c.id?.includes('contacts@group'),
    }))
  } catch { return [] }
}

function loadSelectedCalendarIds() {
  try {
    const raw = localStorage.getItem('morning_hub_context')
    return JSON.parse(raw)?.preferences?.selected_calendar_ids ?? null
  } catch { return null }
}

async function fetchCalendarItems(calendarId, params, accessToken) {
  try {
    const resp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!resp.ok) return []
    const data = await resp.json()
    return data.items || []
  } catch { return [] }
}

async function fetchSpecialEvents(accessToken, allCalendars = []) {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end   = new Date(start); end.setDate(start.getDate() + 14); end.setHours(23, 59, 59, 999)

  const params = new URLSearchParams({
    timeMin:      start.toISOString(),
    timeMax:      end.toISOString(),
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '50',
  }).toString()

  const birthdayCal = allCalendars.find(c => c.isBirthday)

  const [primaryItems, birthdayItems] = await Promise.all([
    fetchCalendarItems('primary', params, accessToken),
    birthdayCal ? fetchCalendarItems(birthdayCal.id, params, accessToken) : Promise.resolve([]),
  ])

  // Deduplicate by event summary+date, then filter for keywords
  const seen = new Set()
  const today = new Date(); today.setHours(0, 0, 0, 0)

  return [...primaryItems, ...birthdayItems]
    .filter(e => SPECIAL_RE.test(e.summary || ''))
    .map(e => {
      const dateStr  = e.start.date || (e.start.dateTime || '').split('T')[0]
      const eventDay = new Date(dateStr + 'T00:00:00')
      const daysAway = Math.round((eventDay - today) / 86400000)
      return { id: e.id, name: e.summary || '(No title)', dateStr, daysAway }
    })
    .filter(e => {
      if (e.daysAway < 0 || e.daysAway > 14) return false
      const key = `${e.name}|${e.dateStr}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.daysAway - b.daysAway)
}

async function fetchUpcomingEvents(accessToken, calendarIds = ['primary']) {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end   = new Date(start); end.setDate(start.getDate() + 14); end.setHours(23, 59, 59, 999)

  const params = new URLSearchParams({
    timeMin:      start.toISOString(),
    timeMax:      end.toISOString(),
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '50',
  }).toString()

  const results = await Promise.allSettled(
    calendarIds.map(id => fetchCalendarItems(id, params, accessToken))
  )
  const seen  = new Set()
  const items = results
    .flatMap(r => r.status === 'fulfilled' ? r.value : [])
    .filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true })
  const today = new Date(); today.setHours(0, 0, 0, 0)

  function classifyType(name, isAllDay) {
    if (/flight|airline|airport|plane/i.test(name))                              return 'flight'
    if (/hotel|airbnb|resort|check.?in|check.?out/i.test(name))                  return 'hotel'
    if (/trip|travel|vacation|holiday/i.test(name))                              return 'trip'
    if (/doctor|dr\b|dentist|medical|physical|therapy|appointment|appt|checkup/i.test(name)) return 'appointment'
    if (/conference|summit|workshop/i.test(name))                                return 'conference'
    if (isAllDay)                                                                 return 'allday'
    return 'event'
  }

  return items
    .filter(e => {
      // Exclude events that match the birthday/anniversary filter (handled separately)
      if (SPECIAL_RE.test(e.summary || '')) return false
      const isAllDay = !e.start.dateTime
      return isAllDay || UPCOMING_RE.test(e.summary || '')
    })
    .map(e => {
      const isAllDay   = !e.start.dateTime
      const dateStr    = e.start.date    || (e.start.dateTime || '').split('T')[0]
      const endDateStr = e.end.date      || (e.end.dateTime   || '').split('T')[0]
      const eventDay   = new Date(dateStr + 'T00:00:00')
      const endDay     = endDateStr ? new Date(endDateStr + 'T00:00:00') : eventDay
      const daysAway   = Math.round((eventDay - today) / 86400000)
      // Google's all-day end date is exclusive (next day), so subtract 1
      const duration   = isAllDay
        ? Math.max(1, Math.round((endDay - eventDay) / 86400000))
        : 1

      return {
        id:       e.id,
        name:     e.summary || '(No title)',
        dateStr,
        daysAway,
        duration,
        isAllDay,
        type:     classifyType(e.summary || '', isAllDay),
        location: e.location ? e.location.split(',').slice(0, 2).join(',').trim() : null,
      }
    })
    .filter(e => e.daysAway >= 0 && e.daysAway <= 14)
    .sort((a, b) => a.daysAway - b.daysAway)
}

// ── Hook ─────────────────────────────────────────────────────

export default function useCalendar() {
  const [token,           setToken]           = useState(() => loadStoredToken())
  const [events,          setEvents]          = useState([])
  const [specialEvents,   setSpecialEvents]   = useState([])
  const [upcomingEvents,  setUpcomingEvents]  = useState([])
  const [calendars,       setCalendars]       = useState([])
  const [loading,         setLoading]         = useState(false)
  const [connecting,      setConnecting]      = useState(false)
  const [error,           setError]           = useState(null)
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

    fetchAllCalendars(token).then(allCals => {
      setCalendars(allCals)

      // Resolve which calendars to fetch from
      const savedIds = loadSelectedCalendarIds()
      const nonBirthday = allCals.filter(c => !c.isBirthday).map(c => c.id)
      const activeIds = savedIds && savedIds.length > 0
        ? savedIds.filter(id => nonBirthday.includes(id))
        : nonBirthday

      const calIds = activeIds.length > 0 ? activeIds : ['primary']

      Promise.all([
        fetchEvents(token, calIds),
        fetchSpecialEvents(token, allCals).catch(() => []),
        fetchUpcomingEvents(token, calIds).catch(() => []),
      ])
        .then(([evts, specials, upcoming]) => {
          setEvents(evts)
          setSpecialEvents(specials)
          setUpcomingEvents(upcoming)
        })
        .catch(err => {
          if (err.status === 401) {
            localStorage.removeItem(TOKEN_KEY)
            setToken(null)
          }
          setError(err.message)
        })
        .finally(() => setLoading(false))
    })
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
    setCalendars([])
  }, [token])

  // Re-fetch events when selected calendars change in preferences
  const refetch = useCallback(() => {
    if (token) setToken(t => t)  // trigger the effect by forcing a re-run
  }, [token])

  return {
    events,
    specialEvents,
    upcomingEvents,
    calendars,
    loading,
    connecting,
    error,
    connected: !!token,
    signIn,
    signOut,
    refetch,
  }
}
