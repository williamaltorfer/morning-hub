import { createContext, useCallback, useContext, useState } from 'react'
import useCalendar from '../hooks/useCalendar'
import useBriefing from '../hooks/useBriefing'
import useVoice from '../hooks/useVoice'

// ── Feed + topic storage ─────────────────────────────────────
const FEEDS_KEY  = 'morning_hub_feeds'
const TOPICS_KEY = 'morning_hub_feed_topics'

export const DEFAULT_FEEDS = [
  { id: 'verge-ai',    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', label: 'The Verge · AI',    topic: 'ai'        },
  { id: 'adexchanger', url: 'https://www.adexchanger.com/feed/',                                 label: 'AdExchanger',        topic: 'perf mktg' },
  { id: 'npr-economy', url: 'https://feeds.npr.org/1017/rss.xml',                                label: 'NPR · Economy',      topic: 'economy'   },
  { id: 'blockclub',   url: 'https://blockclubchicago.org/feed/',                                label: 'Block Club Chicago', topic: 'chicago'   },
]

const DEFAULT_TOPICS = ['ai', 'perf mktg', 'economy', 'chicago']

function loadFeeds() {
  try {
    const raw = localStorage.getItem(FEEDS_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_FEEDS
  } catch { return DEFAULT_FEEDS }
}

function loadTopics() {
  try {
    const raw = localStorage.getItem(TOPICS_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_TOPICS
  } catch { return DEFAULT_TOPICS }
}

function persistFeeds(feeds) {
  try { localStorage.setItem(FEEDS_KEY, JSON.stringify(feeds)) } catch {}
}

function persistTopics(topics) {
  try { localStorage.setItem(TOPICS_KEY, JSON.stringify(topics)) } catch {}
}

function clearFeedCache() {
  try { sessionStorage.removeItem('morning_hub_feed') } catch {}
}

const HubContext = createContext(null)

export function HubProvider({ children }) {
  const [settingsOpen,     setSettingsOpen]     = useState(false)
  const [feedManageOpen,   setFeedManageOpen]   = useState(false)
  const [activeSpTab,      setActiveSpTab]      = useState('goals')
  const [activeScopeTab,   setActiveScopeTab]   = useState('today')
  const [activeTopicPill,  setActiveTopicPill]  = useState('all')
  const [feeds,  setFeeds]  = useState(loadFeeds)
  const [topics, setTopics] = useState(loadTopics)

  // ── Feed mutations ───────────────────────────────────────────
  const addFeed = useCallback((feed) => {
    setFeeds(prev => {
      const next = [...prev, feed]
      persistFeeds(next)
      clearFeedCache()
      return next
    })
    // Auto-register the topic if it's new
    if (feed.topic) {
      setTopics(prev => {
        if (prev.includes(feed.topic)) return prev
        const next = [...prev, feed.topic]
        persistTopics(next)
        return next
      })
    }
  }, [])

  const removeFeed = useCallback((id) => {
    setFeeds(prev => {
      const next = prev.filter(f => f.id !== id)
      persistFeeds(next)
      clearFeedCache()
      return next
    })
  }, [])

  const updateFeedTopic = useCallback((id, topic) => {
    setFeeds(prev => {
      const next = prev.map(f => f.id === id ? { ...f, topic } : f)
      persistFeeds(next)
      clearFeedCache()
      return next
    })
  }, [])

  // ── Topic mutations ──────────────────────────────────────────
  const addTopic = useCallback((name) => {
    const key = name.trim().toLowerCase()
    if (!key) return
    setTopics(prev => {
      if (prev.includes(key)) return prev
      const next = [...prev, key]
      persistTopics(next)
      return next
    })
  }, [])

  const renameTopic = useCallback((oldName, newName) => {
    const key = newName.trim().toLowerCase()
    if (!key || key === oldName) return
    setTopics(prev => {
      const next = prev.map(t => t === oldName ? key : t)
      persistTopics(next)
      return next
    })
    setFeeds(prev => {
      const next = prev.map(f => f.topic === oldName ? { ...f, topic: key } : f)
      persistFeeds(next)
      clearFeedCache()
      return next
    })
  }, [])

  const removeTopic = useCallback((name) => {
    setTopics(prev => {
      const next = prev.filter(t => t !== name)
      persistTopics(next)
      return next
    })
    // Unassign topic from any feeds using it
    setFeeds(prev => {
      const next = prev.map(f => f.topic === name ? { ...f, topic: '' } : f)
      persistFeeds(next)
      clearFeedCache()
      return next
    })
  }, [])

  const calendar = useCalendar()
  const briefing = useBriefing({
    events:    calendar.events,
    connected: calendar.connected,
  })
  const voice = useVoice({
    events:   calendar.events,
    briefing: briefing.briefing,
  })

  return (
    <HubContext.Provider value={{
      settingsOpen,
      openSettings:    () => setSettingsOpen(true),
      closeSettings:   () => setSettingsOpen(false),
      feedManageOpen,
      openFeedManage:  () => setFeedManageOpen(true),
      closeFeedManage: () => setFeedManageOpen(false),
      activeSpTab, setActiveSpTab,
      activeScopeTab, setActiveScopeTab,
      activeTopicPill, setActiveTopicPill,
      feeds, addFeed, removeFeed, updateFeedTopic,
      topics, addTopic, renameTopic, removeTopic,
      calendar,
      briefing,
      voice,
    }}>
      {children}
    </HubContext.Provider>
  )
}

export function useHub() {
  return useContext(HubContext)
}
