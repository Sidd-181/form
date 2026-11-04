import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import auth from './routes/auth'
import forms from './routes/forms'
import pub from './routes/public'
import settings from './routes/settings'
import { errorHandler } from './middleware'

const { MONGODB_URI, JWT_SECRET, PORT = '4000', CLIENT_ORIGIN = 'http://localhost:5173' } = process.env
if (!MONGODB_URI || !JWT_SECRET || JWT_SECRET.length < 32) { console.error('Set MONGODB_URI and a JWT_SECRET of 32+ characters (see .env.example).'); process.exit(1) }

const app = express()
app.use(helmet(), cors({ origin: CLIENT_ORIGIN.split(',') }), express.json({ limit: '1mb' }))
app.get('/api/health', (_req, res) => { res.json({ ok: true }) })
app.use('/api/auth', rateLimit({ windowMs: 15 * 60_000, limit: 30 }), auth)
app.use('/api/forms', forms)
app.use('/api/settings', rateLimit({ windowMs: 15 * 60_000, limit: 60 }), settings)
app.use('/api/public', rateLimit({ windowMs: 60_000, limit: 60 }), pub)
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not found' }) })
app.use(errorHandler)

mongoose.connect(MONGODB_URI).then(() => app.listen(Number(PORT), () => console.log(`API listening on :${PORT}`)))
  .catch(e => { console.error('MongoDB connection failed:', e.message); process.exit(1) })
