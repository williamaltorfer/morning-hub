export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url param' })

  const key    = process.env.RSS2JSON_API_KEY
  const params = new URLSearchParams({ rss_url: url, count: '10' })
  if (key) params.set('api_key', key)

  try {
    const upstream = await fetch(`https://api.rss2json.com/v1/api.json?${params}`)
    const data = await upstream.json()
    res.setHeader('Cache-Control', 'public, max-age=1800')
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
