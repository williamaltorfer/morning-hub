import { useHub } from '../../context/HubContext'

const TOPICS = ['All', 'AI', 'Perf Mktg', 'Economy', 'Chicago', '+ Follow']

const NEWS = [
  { source: 'The Information · AI',  age: '2h ago', headline: "Google DeepMind's reasoning model outperforms GPT-4o on ad optimization tasks", snippet: 'Implications for automated bidding and creative testing pipelines...' },
  { source: 'Ad Age · Performance',  age: '4h ago', headline: 'Meta Advantage+ now accounts for 38% of spend among top 500 US advertisers', snippet: 'AI-native campaign structures raising new questions about creative control...' },
  { source: 'WSJ · Economy',         age: '6h ago', headline: 'Fed minutes signal two rate cuts possible in H2 as inflation cools to 2.8%', snippet: 'Markets responded positively to signs the tightening cycle may be ending...' },
  { source: 'Chicago Tribune',       age: '1h ago', headline: 'Cubs bullpen ranked 3rd in MLB after dominant May; Wrigley sellout tonight', snippet: 'Classic Wrigley atmosphere expected as the division rivalry heats up...' },
  { source: 'Marketing Brew · AI',   age: '3h ago', headline: 'How leading agencies are structuring AI workflows for creative attribution', snippet: 'The hybrid model blending generative tools with first-party signal analysis...' },
]

export default function FeedColumn() {
  const { activeTopicPill, setActiveTopicPill } = useHub()

  return (
    <>
      <div className="desktop-col-header">
        <span className="desktop-col-title"><em>Feed</em></span>
        <span className="sec-action">Manage</span>
      </div>

      <div className="topic-row">
        {TOPICS.map(t => (
          <span
            key={t}
            className={`t-pill${activeTopicPill === t.toLowerCase() ? ' active' : ''}`}
            onClick={() => setActiveTopicPill(t.toLowerCase())}
          >{t}</span>
        ))}
      </div>

      <div className="claude-suggestion">
        <div className="cs-label">Claude suggests</div>
        <div className="cs-text">Based on your AI follows, consider adding "OpenAI product updates" — significant news this week relevant to your attribution work.</div>
      </div>

      <div className="card">
        {NEWS.map(item => (
          <div key={item.headline} className="news-item">
            <div className="ni-row1">
              <span className="ni-source">{item.source}</span>
              <span className="ni-age">{item.age}</span>
            </div>
            <div className="ni-headline">{item.headline}</div>
            <div className="ni-snippet">{item.snippet}</div>
          </div>
        ))}
      </div>
    </>
  )
}
