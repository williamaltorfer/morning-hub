import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load ALL .env vars (not just VITE_ prefixed) so the dev middleware
  // can access ANTHROPIC_API_KEY without exposing it to the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), devBriefingProxy(env)],
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
