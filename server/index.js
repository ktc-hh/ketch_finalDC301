import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import menuRoutes from './routes/menu.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = Number(process.env.PORT || 3001)
const distPath = path.resolve(here, '../dist')

app.use(express.json({ limit: '2mb' }))
app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api', menuRoutes)
app.use(express.static(distPath))
app.use((req, res, next) => {
  if (req.method !== 'GET') return next()
  res.sendFile(path.join(distPath, 'index.html'), (error) => {
    if (error) res.status(404).json({ error: 'Frontend build not found. Run npm run build.' })
  })
})

app.listen(port, '0.0.0.0', () => console.log(`Kainan API listening on http://localhost:${port}`))