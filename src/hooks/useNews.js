import { useEffect, useState } from 'react'

const CACHE_KEY = 'morning_hub_feed'
const CACHE_TTL = 30 * 60 * 1000

const FEEDS = [
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', label: 'The Verge · AI',      topic: 'ai'       },
  { url: 'https://www.marketingbrew.com/feeds/posts',                          label: 'Marketing Brew',       topic: 'perf mktg'},
  { url: 'https://feeds.wsj.com/xml/rss/3_7085.xml',                           label: 'WSJ · Economy',        topic: 'economy'  },
  { url: 'https://www.chicagotribune.com/feed/',                                label: 'Chicago Tribune',      topic: 'chicago'  },
]

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

export default function useNews() {
  const [articles, setArticles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    const cached = loadCache()
    if (cached) {
      setArticles(cached)
      setLoading(false)
      return
    }

    Promise.allSettled(FEEDS.map(fetchFeed))
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
  }, [])

  return { articles, loading, error }
}
