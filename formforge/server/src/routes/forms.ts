import { Router, type Request, type Response } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { Form, FormResponse } from '../models'
import { requireAuth } from '../middleware'
import { formBody } from '../validate'

const r = Router()
r.use(requireAuth)

const own = (req: Request, res: Response) => {
  const id = String(req.params.id)
  return mongoose.isValidObjectId(id) ? Form.findOne({ _id: id, owner: res.locals.userId }) : null
}
const notFound = (res: Response) => { res.status(404).json({ error: 'Form not found' }) }

r.get('/', async (_req, res) => {
  const forms = await Form.find({ owner: res.locals.userId }).sort({ updatedAt: -1 })
  const counts = await FormResponse.aggregate([{ $match: { form: { $in: forms.map(f => f._id) } } }, { $group: { _id: '$form', n: { $sum: 1 } } }])
  const byId = new Map(counts.map(c => [String(c._id), c.n as number]))
  res.json(forms.map(f => ({ ...f.toJSON(), responseCount: byId.get(String(f._id)) ?? 0 })))
})

// Latest responses across all of the user's forms (dashboard activity feed).
r.get('/activity', async (_req, res) => {
  const ids = (await Form.find({ owner: res.locals.userId }).select('_id')).map(f => f._id)
  res.json(await FormResponse.find({ form: { $in: ids } }).sort({ createdAt: -1 }).limit(20))
})

r.post('/', async (req, res) => {
  const b = formBody.parse(req.body)
  const form = await Form.create({ ...b, expiresAt: b.expiresAt ? new Date(b.expiresAt) : null, owner: res.locals.userId })
  res.status(201).json(form)
})

r.get('/:id', async (req, res) => {
  const form = await own(req, res)
  form ? res.json(form) : notFound(res)
})

// Partial update: autosave sends content only and must not reset limit/expiry.
r.patch('/:id', async (req, res) => {
  const form = await own(req, res)
  if (!form) return notFound(res)
  const { expiresAt, ...rest } = formBody.partial().parse(req.body)
  form.set(rest)
  if (expiresAt !== undefined) form.expiresAt = expiresAt ? new Date(expiresAt) : null
  await form.save()
  res.json(form)
})

r.post('/:id/status', async (req, res) => {
  const form = await own(req, res)
  if (!form) return notFound(res)
  const { status } = z.object({ status: z.enum(['draft', 'published']) }).parse(req.body)
  if (status === 'published' && form.fields.length === 0) { res.status(400).json({ error: 'Add at least one field before publishing' }); return }
  form.status = status
  await form.save()
  res.json(form)
})

r.post('/:id/duplicate', async (req, res) => {
  const src = await own(req, res)
  if (!src) return notFound(res)
  const copy = await Form.create({
    owner: src.owner, title: `${src.title} (copy)`, description: src.description, accent: src.accent,
    fields: src.toObject().fields, submissionLimit: src.submissionLimit, expiresAt: src.expiresAt, status: 'draft',
  })
  res.status(201).json(copy)
})

r.delete('/:id', async (req, res) => {
  const form = await own(req, res)
  if (!form) return notFound(res)
  await FormResponse.deleteMany({ form: form._id })
  await form.deleteOne()
  res.status(204).end()
})

r.get('/:id/responses', async (req, res) => {
  const form = await own(req, res)
  if (!form) return notFound(res)
  res.json(await FormResponse.find({ form: form._id }).sort({ createdAt: -1 }))
})

r.delete('/:id/responses/:rid', async (req, res) => {
  const form = await own(req, res)
  if (!form) return notFound(res)
  const rid = String(req.params.rid)
  if (!mongoose.isValidObjectId(rid)) { res.status(404).json({ error: 'Response not found' }); return }
  const { deletedCount } = await FormResponse.deleteOne({ _id: rid, form: form._id })
  deletedCount ? res.status(204).end() : res.status(404).json({ error: 'Response not found' })
})

export default r
