import { useHub } from '../../context/HubContext'
import useNews from '../../hooks/useNews'

function ExternalLinkIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .4, flexShrink: 0 }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function NewsItem({ item }) {
  return (
    <div
      className="news-item"
      onClick={() => item.url && window.open(item.url, '_blank', 'noopener')}
      role="link"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && item.url && window.open(item.url, '_blank', 'noopener')}
    >
      <div className="ni-row1">
        <span className="ni-source">{item.source}</span>
        <span className="ni-age">{item.age}</span>
      </div>
      <div className="ni-headline-row">
        <div className="ni-headline">{item.headline}</div>
        <ExternalLinkIcon />
      </div>
      {item.snippet && <div className="ni-snippet">{item.snippet}</div>}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="card">
      {[1, 2, 3].map(i => (
        <div key={i} className="news-item feed-skeleton">
          <div className="fs-source" />
          <div className="fs-headline" />
          <div className="fs-snippet" />
        </div>
      ))}
    </div>
  )
}

export default function FeedColumn() {
  const { activeTopicPill, setActiveTopicPill, feeds, openFeedManage } = useHub()
  const { articles, loading, error } = useNews(feeds)

  // Derive topic pills dynamically from saved feeds
  const topics = ['all', ...new Set(feeds.map(f => f.topic).filter(Boolean))]

  const filtered = activeTopicPill === 'all'
    ? articles
    : articles.filter(a => a.topic === activeTopicPill)

  function handleTopicClick(t) {
    if (t === '+') { openFeedManage(); return }
    setActiveTopicPill(t)
  }

  return (
    <>
      <div className="desktop-col-header">
        <span className="desktop-col-title"><em>Feed</em></span>
        <span className="sec-action" onClick={openFeedManage}>Manage</span>
      </div>

      <div className="topic-row">
        {topics.map(t => (
          <span
            key={t}
            className={`t-pill${activeTopicPill === t ? ' active' : ''}`}
            onClick={() => handleTopicClick(t)}
          >
            {t === 'all' ? 'All' : t}
          </span>
        ))}
        <span className="t-pill t-pill-add" onClick={openFeedManage}>
          <PlusIcon /> Follow
        </span>
      </div>

      <div className="claude-suggestion">
        <div className="cs-label">Claude suggests</div>
        <div className="cs-text">Add your goals and context in Settings to get personalized feed recommendations based on what you&apos;re working on.</div>
      </div>

      {loading && <FeedSkeleton />}

      {error && !loading && (
        <div className="feed-error">Unable to load feeds — check your connection.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card">
          {filtered.map(item => <NewsItem key={item.id} item={item} />)}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && articles.length > 0 && (
        <div className="feed-empty">No articles for this topic yet.</div>
      )}

      {!loading && !error && feeds.length === 0 && (
        <div className="feed-empty">
          No feeds configured. <span style={{ color: 'var(--terra)', cursor: 'pointer' }} onClick={openFeedManage}>Add a feed</span>
        </div>
      )}
    </>
  )
}
