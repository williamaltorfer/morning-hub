import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), devBriefingProxy()],
})

// Proxies /api/briefing to Anthropic during local dev (npm run dev).
// In production, Vercel routes this to api/briefing.js.
function devBriefingProxy() {
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
              'x-api-key': process.env.ANTHROPIC_API_KEY,
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
