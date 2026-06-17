import { useHub } from '../../context/HubContext'
import useNews from '../../hooks/useNews'

const TOPICS = ['All', 'AI', 'Perf Mktg', 'Economy', 'Chicago']

function ExternalLinkIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .4, flexShrink: 0 }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
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
  const { activeTopicPill, setActiveTopicPill } = useHub()
  const { articles, loading, error } = useNews()

  const filtered = activeTopicPill === 'all'
    ? articles
    : articles.filter(a => a.topic === activeTopicPill)

  return (
    <>
      <div className="desktop-col-header">
        <span className="desktop-col-title"><em>Feed</em></span>
        <span className="sec-action">Manage</span>
      </div>

      <div className="topic-row">
        {TOPICS.map(t => {
          const val = t.toLowerCase()
          return (
            <span
              key={t}
              className={`t-pill${activeTopicPill === val ? ' active' : ''}`}
              onClick={() => setActiveTopicPill(val)}
            >{t}</span>
          )
        })}
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
    </>
  )
}
