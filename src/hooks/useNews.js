import { useEffect, useRef, useState } from 'react'

const CACHE_KEY = 'morning_hub_feed'
const CACHE_TTL = 30 * 60 * 1000

function relAge(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()
}

function mapItem(item, feed) {
  const snippet = stripHtml(item.description || item.content || '')
  return {
    id:          item.link || item.guid,
    source:      feed.label,
    topic:       feed.topic,
    age:         relAge(item.pubDate),
    publishedAt: new Date(item.pubDate).getTime(),
    headline:    item.title || '(No title)',
    snippet:     snippet.length > 140 ? snippet.slice(0, 137) + '…' : snippet,
    url:         item.link,
  }
}

async function fetchFeed(feed) {
  const resp = await fetch(`/api/news?url=${encodeURIComponent(feed.url)}`)
  if (!resp.ok) throw new Error(`Feed error ${resp.status}`)
  const json = await resp.json()
  if (json.status !== 'ok') throw new Error(json.message || 'Feed error')
  return (json.items || []).map(item => mapItem(item, feed))
}

function loadCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, articles } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return articles
  } catch { return null }
}

function saveCache(articles) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), articles }))
  } catch {}
}

// feeds is the live array from HubContext; changes trigger a refetch
export default function useNews(feeds = []) {
  const [articles, setArticles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  // Stable ref so the effect body can read latest feeds without re-declaring
  const feedsRef = useRef(feeds)
  feedsRef.current = feeds

  useEffect(() => {
    if (!feeds.length) { setLoading(false); return }

    const cached = loadCache()
    if (cached) {
      setArticles(cached)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    Promise.allSettled(feedsRef.current.map(fetchFeed))
      .then(results => {
        const merged = results
          .flatMap(r => r.status === 'fulfilled' ? r.value : [])
          .sort((a, b) => b.publishedAt - a.publishedAt)

        if (merged.length === 0 && results.every(r => r.status === 'rejected')) {
          setError('Unable to load feeds')
        } else {
          saveCache(merged)
          setArticles(merged)
        }
      })
      .finally(() => setLoading(false))
  }, [feeds]) // re-runs when feeds array reference changes (add/remove)

  return { articles, loading, error }
}
