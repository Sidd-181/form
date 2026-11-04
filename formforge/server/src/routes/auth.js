const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { z } = require('zod')
const { User, publicUser } = require('../models')
const { requireAuth, signToken } = require('../middleware')

const r = Router()
const creds = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(128) })
const session = u => ({ token: signToken(String(u._id)), user: publicUser(u) })

r.post('/signup', async (req, res) => {
  const b = creds.extend({ name: z.string().trim().min(1).max(100) }).parse(req.body)
  if (await User.exists({ email: b.email.toLowerCase() })) { res.status(409).json({ error: 'An account with this email already exists' }); return }
  const user = await User.create({ name: b.name, email: b.email, passwordHash: await bcrypt.hash(b.password, 12) })
  res.status(201).json(session(user))
})

r.post('/login', async (req, res) => {
  const b = creds.parse(req.body)
  const user = await User.findOne({ email: b.email.toLowerCase() })
  if (!user || !(await bcrypt.compare(b.password, user.passwordHash))) { res.status(401).json({ error: 'Invalid email or password' }); return }
  res.json(session(user))
})

r.get('/me', requireAuth, async (_req, res) => {
  const user = await User.findById(res.locals.userId)
  if (!user) { res.status(401).json({ error: 'Authentication required' }); return }
  res.json(publicUser(user))
})

module.exports = r
