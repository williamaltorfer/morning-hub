import { useEffect, useRef, useState } from 'react'
import { useHub } from '../../context/HubContext'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ── Icons ────────────────────────────────────────────────────

function XIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .4 }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

// ── Label chip (with inline rename) ─────────────────────────

function LabelChip({ name, count, onRename, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(name)
  const inputRef              = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  function save() {
    const trimmed = val.trim()
    if (trimmed && trimmed !== name) onRename(name, trimmed)
    else setVal(name)
    setEditing(false)
  }

  function onKey(e) {
    if (e.key === 'Enter')  { e.preventDefault(); save() }
    if (e.key === 'Escape') { setVal(name); setEditing(false) }
  }

  if (editing) {
    return (
      <div className="label-chip label-chip-editing">
        <input
          ref={inputRef}
          className="label-chip-input"
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={onKey}
        />
      </div>
    )
  }

  return (
    <div className="label-chip">
      <span className="label-chip-name" onClick={() => setEditing(true)} title="Click to rename">
        {name}
      </span>
      {count > 0 && <span className="label-chip-count">{count}</span>}
      <button className="label-chip-edit" onClick={() => setEditing(true)} aria-label="Rename"><PencilIcon /></button>
      <button className="label-chip-x" onClick={() => onDelete(name)} aria-label="Delete"><XIcon size={9} /></button>
    </div>
  )
}

// ── Labels section ───────────────────────────────────────────

function LabelsSection({ topics, feeds, onAdd, onRename, onDelete }) {
  const [newLabel, setNewLabel] = useState('')

  function countFeeds(topic) {
    return feeds.filter(f => f.topic === topic).length
  }

  function handleAdd(e) {
    e.preventDefault()
    if (!newLabel.trim()) return
    onAdd(newLabel.trim())
    setNewLabel('')
  }

  return (
    <div className="fmp-labels-section">
      <div className="context-field-label" style={{ marginTop: 0 }}>Labels</div>

      {topics.length === 0 ? (
        <p className="context-hint">No labels yet. Create one below.</p>
      ) : (
        <div className="label-chip-row">
          {topics.map(t => (
            <LabelChip
              key={t}
              name={t}
              count={countFeeds(t)}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <form className="fmp-label-add-row" onSubmit={handleAdd}>
        <input
          className="context-input fmp-label-input"
          placeholder="New label…"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
        />
        <button type="submit" className="goal-action-btn primary" disabled={!newLabel.trim()}>
          Add
        </button>
      </form>
      <p className="context-hint">Click a label name to rename it inline.</p>
    </div>
  )
}

// ── Add feed form ────────────────────────────────────────────

function AddFeedForm({ topics, onAdd }) {
  const [url,        setUrl]        = useState('')
  const [topicVal,   setTopicVal]   = useState('')
  const [newTopic,   setNewTopic]   = useState('')
  const [verifying,  setVerifying]  = useState(false)
  const [preview,    setPreview]    = useState(null)
  const [verifyMsg,  setVerifyMsg]  = useState('')

  const isNewTopic = topicVal === '__new__'
  const effectiveTopic = isNewTopic ? newTopic.trim().toLowerCase() : topicVal

  async function verify() {
    const trimmed = url.trim()
    if (!trimmed) return
    setVerifying(true)
    setPreview(null)
    setVerifyMsg('')
    try {
      const resp = await fetch(`/api/news?url=${encodeURIComponent(trimmed)}`)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      if (data.status !== 'ok') throw new Error(data.message || 'Feed returned an error')
      const label    = data.feed?.title || new URL(trimmed).hostname
      const headline = data.items?.[0]?.title || null
      setPreview({ label, headline })
      // Pre-select first topic if none chosen yet
      if (!topicVal && topics.length > 0) setTopicVal(topics[0])
    } catch (err) {
      setVerifyMsg(`Could not load feed: ${err.message}`)
    } finally {
      setVerifying(false)
    }
  }

  function handleAdd() {
    if (!preview || !effectiveTopic) return
    onAdd({
      id:    uid(),
      url:   url.trim(),
      label: preview.label,
      topic: effectiveTopic,
    })
    setUrl('')
    setTopicVal('')
    setNewTopic('')
    setPreview(null)
    setVerifyMsg('')
  }

  const canAdd = preview && effectiveTopic

  return (
    <div className="fmp-add-section">
      <div className="context-field-label">Add a feed</div>
      <div className="fmp-url-row">
        <input
          className="context-input"
          style={{ flex: 1 }}
          placeholder="https://example.com/feed.xml"
          value={url}
          onChange={e => { setUrl(e.target.value); setPreview(null); setVerifyMsg('') }}
          onKeyDown={e => e.key === 'Enter' && verify()}
        />
        <button
          className="goal-action-btn primary"
          onClick={verify}
          disabled={verifying || !url.trim()}
        >
          {verifying ? '…' : 'Verify'}
        </button>
      </div>

      {verifyMsg && (
        <p className="context-hint" style={{ color: 'var(--terra)' }}>{verifyMsg}</p>
      )}

      {preview && (
        <div className="fmp-preview">
          <div className="fmp-preview-label">{preview.label}</div>
          {preview.headline && (
            <div className="fmp-preview-headline">{preview.headline}</div>
          )}

          <div className="fmp-topic-row">
            <select
              className="context-input fmp-topic-select"
              value={topicVal}
              onChange={e => setTopicVal(e.target.value)}
            >
              {topics.length === 0 && <option value="">No labels yet — create one first</option>}
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="__new__">+ Create new label…</option>
            </select>
          </div>

          {isNewTopic && (
            <input
              className="context-input"
              style={{ marginTop: 6 }}
              placeholder="New label name…"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              autoFocus
            />
          )}

          <button
            className="goal-action-btn primary"
            style={{ marginTop: 10, width: '100%', padding: '9px' }}
            onClick={handleAdd}
            disabled={!canAdd}
          >
            Add feed
          </button>
        </div>
      )}
    </div>
  )
}

// ── Feed row ─────────────────────────────────────────────────

function FeedRow({ feed, topics, onRemove, onChangeTopic }) {
  let hostname = feed.url
  try { hostname = new URL(feed.url).hostname.replace(/^www\./, '') } catch {}

  return (
    <div className="fmp-feed-row">
      <div className="fmp-feed-info">
        <div className="fmp-feed-label">{feed.label}</div>
        <div className="fmp-feed-meta">
          <select
            className="fmp-topic-inline-select"
            value={feed.topic || ''}
            onChange={e => onChangeTopic(feed.id, e.target.value)}
          >
            <option value="">Untagged</option>
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="fmp-feed-url" onClick={() => window.open(feed.url, '_blank', 'noopener')}>
            {hostname} <ExternalIcon />
          </span>
        </div>
      </div>
      <button
        className="fmp-remove-btn"
        onClick={() => onRemove(feed.id)}
        aria-label={`Remove ${feed.label}`}
      >
        <TrashIcon />
      </button>
    </div>
  )
}

// ── Panel ────────────────────────────────────────────────────

export default function FeedManagePanel() {
  const {
    feedManageOpen, closeFeedManage,
    feeds, addFeed, removeFeed, updateFeedTopic,
    topics, addTopic, renameTopic, removeTopic,
  } = useHub()

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') closeFeedManage() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeFeedManage])

  return (
    <>
      <div
        className={`settings-backdrop${feedManageOpen ? ' open' : ''}`}
        onClick={closeFeedManage}
      />
      <div className={`settings-panel${feedManageOpen ? ' open' : ''}`}>
        <div className="sp-header">
          <div className="sp-title-group">
            <span className="sp-script">curate</span>
            <h2 className="sp-title">Your <em>Feed</em></h2>
          </div>
          <button className="sp-close" onClick={closeFeedManage}><XIcon /></button>
        </div>

        <div className="sp-body">
          <LabelsSection
            topics={topics}
            feeds={feeds}
            onAdd={addTopic}
            onRename={renameTopic}
            onDelete={removeTopic}
          />

          <div className="fmp-divider" />

          <AddFeedForm topics={topics} onAdd={addFeed} />

          <div className="fmp-divider" />

          <div className="context-field-label" style={{ marginTop: 0 }}>
            Active feeds ({feeds.length})
          </div>

          {feeds.length === 0 ? (
            <p className="context-hint">No feeds yet. Add one above.</p>
          ) : (
            <div className="fmp-feed-list">
              {feeds.map(f => (
                <FeedRow
                  key={f.id}
                  feed={f}
                  topics={topics}
                  onRemove={removeFeed}
                  onChangeTopic={updateFeedTopic}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
