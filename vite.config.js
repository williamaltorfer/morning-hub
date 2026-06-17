import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load ALL .env vars (not just VITE_ prefixed) so the dev middleware
  // can access ANTHROPIC_API_KEY without exposing it to the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), devBriefingProxy(env), devNewsProxy(env)],
  }
})

function devBriefingProxy(env) {
  return {
    name: 'dev-briefing-proxy',
    configureServer(server) {
      server.middlewares.use('/api/briefing', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const body = JSON.parse(Buffer.concat(chunks).toString())

        try {
          const upstream = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(body),
          })

          const data = await upstream.json()
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = upstream.status
          res.end(JSON.stringify(data))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

function devNewsProxy(env) {
  return {
    name: 'dev-news-proxy',
    configureServer(server) {
      server.middlewares.use('/api/news', async (req, res) => {
        const feedUrl = new URL(req.url, 'http://localhost').searchParams.get('url')
        if (!feedUrl) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Missing url param' }))
          return
        }

        const key    = env.RSS2JSON_API_KEY
        const params = new URLSearchParams({ rss_url: feedUrl })
        if (key) { params.set('api_key', key); params.set('count', '10') }

        try {
          const upstream = await fetch(`https://api.rss2json.com/v1/api.json?${params}`)
          const data = await upstream.json()
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = upstream.status
          res.end(JSON.stringify(data))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}
