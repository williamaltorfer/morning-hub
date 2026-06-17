import { useEffect, useState } from 'react'

const DEFAULTS = {
  lat:      41.9203,
  lon:     -87.6349,
  timezone: 'America/Chicago',
  location: 'Chicago · Lincoln Park',
}

function loadLocationPrefs() {
  try {
    const raw = localStorage.getItem('morning_hub_context')
    if (!raw) return DEFAULTS
    const prefs = JSON.parse(raw)?.preferences
    if (prefs?.locationLat && prefs?.locationLon) {
      return {
        lat:      prefs.locationLat,
        lon:      prefs.locationLon,
        timezone: 'America/Chicago',
        location: prefs.location || DEFAULTS.location,
      }
    }
  } catch {}
  return DEFAULTS
}

const WMO_LABEL = {
  0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Foggy',
  51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
  61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
  71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
  80: 'Showers', 81: 'Showers', 82: 'Heavy Showers',
  85: 'Snow Showers', 86: 'Heavy Snow Showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
}

export function wmoIcon(code, hour) {
  const night = hour >= 20 || hour < 6
  if (code === 0 || code === 1)      return night ? 'moon' : 'sun'
  if (code === 2 || code === 3)      return 'cloud'
  if (code >= 51 && code <= 67)      return 'rain'
  if (code >= 71 && code <= 77)      return 'snow'
  if (code >= 80 && code <= 82)      return 'rain'
  if (code === 85 || code === 86)    return 'snow'
  if (code >= 95)                    return 'thunder'
  return night ? 'moon' : 'sun'
}

function label(code) {
  return WMO_LABEL[code] ?? 'Unknown'
}

function formatHour(iso) {
  const d = new Date(iso)
  const h = d.getHours()
  if (h === 0)  return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

export default function useWeather() {
  const [state, setState] = useState({ loading: true, error: null, data: null })

  useEffect(() => {
    const loc = loadLocationPrefs()
    const url = [
      'https://api.open-meteo.com/v1/forecast',
      `?latitude=${loc.lat}&longitude=${loc.lon}`,
      '&current=temperature_2m,weathercode,windspeed_10m',
      '&hourly=temperature_2m,weathercode,precipitation_probability',
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      '&temperature_unit=fahrenheit&wind_speed_unit=mph',
      `&timezone=${encodeURIComponent(loc.timezone)}&forecast_days=1`,
    ].join('')

    fetch(url)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(json => {
        const cur    = json.current
        const hourly = json.hourly
        const daily  = json.daily

        const allTimes = hourly.time

        // cur.time is "YYYY-MM-DDTHH:mm" (15-min interval), hourly is on the hour.
        // Slice the hour digits directly — avoids JS timezone parsing pitfalls.
        const nowHour  = parseInt(cur.time.slice(11, 13), 10)
        const startIdx = nowHour  // hourly array is 0–23 indexed by hour-of-day

        // Pick 6 slots: current + every 2 hours
        const slots = []
        for (let i = 0; i < 6; i++) {
          const idx = Math.min(startIdx + i * 2, allTimes.length - 1)
          const slotHour = parseInt(allTimes[idx].slice(11, 13), 10)
          slots.push({
            label:    i === 0 ? 'Now' : formatHour(allTimes[idx]),
            iconType: wmoIcon(hourly.weathercode[idx], slotHour),
            temp:     `${Math.round(hourly.temperature_2m[idx])}°`,
          })
        }

        const rainPct = hourly.precipitation_probability[startIdx] ?? 0

        setState({
          loading: false,
          error: null,
          data: {
            temp:      Math.round(cur.temperature_2m),
            condition: label(cur.weathercode),
            iconType:  wmoIcon(cur.weathercode, nowHour),
            location:  loc.location,
            high:      Math.round(daily.temperature_2m_max[0]),
            low:       Math.round(daily.temperature_2m_min[0]),
            wind:      Math.round(cur.windspeed_10m),
            rain:      rainPct,
            hourly:    slots,
          },
        })
      })
      .catch(err => setState({ loading: false, error: err.message, data: null }))
  }, [])

  return state
}
