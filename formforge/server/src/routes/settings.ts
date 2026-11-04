import { Router, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { User, Form, FormResponse, publicUser } from '../models'
import { requireAuth } from '../middleware'

const r = Router()
r.use(requireAuth)

const current = (res: Response) => User.findById(res.locals.userId)
const pw = z.string().min(1).max(128)
// Wrong-password answers use 403, not 401, so the client doesn't treat them as an expired session.
const wrongPassword = (res: Response) => { res.status(403).json({ error: 'Current password is incorrect' }) }

r.patch('/', async (req, res) => {
  const b = z.object({
    name: z.string().trim().min(1).max(100), workspaceName: z.string().trim().max(100),
    defaultAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    notifications: z.object({ newResponse: z.boolean(), weeklyDigest: z.boolean() }).partial(),
  }).partial().parse(req.body)
  const u = await current(res)
  if (!u) { res.status(401).json({ error: 'Authentication required' }); return }
  if (b.name !== undefined) u.name = b.name
  if (b.workspaceName !== undefined) u.workspaceName = b.workspaceName
  if (b.defaultAccent !== undefined) u.defaultAccent = b.defaultAccent
  if (b.notifications?.newResponse !== undefined) u.set('notifications.newResponse', b.notifications.newResponse)
  if (b.notifications?.weeklyDigest !== undefined) u.set('notifications.weeklyDigest', b.notifications.weeklyDigest)
  await u.save()
  res.json(publicUser(u))
})

r.post('/email', async (req, res) => {
  const b = z.object({ email: z.string().trim().email().max(254), password: pw }).parse(req.body)
  const u = await current(res)
  if (!u) { res.status(401).json({ error: 'Authentication required' }); return }
  if (!(await bcrypt.compare(b.password, u.passwordHash))) return wrongPassword(res)
  const email = b.email.toLowerCase()
  if (email !== u.email && (await User.exists({ email }))) { res.status(409).json({ error: 'That email is already in use' }); return }
  u.email = email
  await u.save()
  res.json(publicUser(u))
})

r.post('/password', async (req, res) => {
  const b = z.object({ currentPassword: pw, newPassword: z.string().min(8).max(128) }).parse(req.body)
  const u = await current(res)
  if (!u) { res.status(401).json({ error: 'Authentication required' }); return }
  if (!(await bcrypt.compare(b.currentPassword, u.passwordHash))) return wrongPassword(res)
  u.passwordHash = await bcrypt.hash(b.newPassword, 12)
  await u.save()
  res.status(204).end()
})

r.delete('/account', async (req, res) => {
  const b = z.object({ password: pw }).parse(req.body)
  const u = await current(res)
  if (!u) { res.status(401).json({ error: 'Authentication required' }); return }
  if (!(await bcrypt.compare(b.password, u.passwordHash))) return wrongPassword(res)
  const ids = (await Form.find({ owner: u._id }).select('_id')).map(f => f._id)
  await FormResponse.deleteMany({ form: { $in: ids } })
  await Form.deleteMany({ owner: u._id })
  await u.deleteOne()
  res.status(204).end()
})

export default r
