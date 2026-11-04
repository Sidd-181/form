const { Router } = require('express')
const mongoose = require('mongoose')
const { Form, FormResponse } = require('../models')
const { checkAnswers } = require('../validate')

const r = Router()

const fail = (status, code, message, title) => ({ form: null, err: { status, code, message, title } })

// Resolves a form for respondents, or the reason it is closed.
async function openForm(id) {
  if (!mongoose.isValidObjectId(id)) return fail(404, 'not_found', 'Form not found')
  const form = await Form.findById(id)
  if (!form) return fail(404, 'not_found', 'Form not found')
  const closed = (status, code, message) => fail(status, code, message, form.title)
  if (form.status !== 'published') return closed(403, 'unpublished', 'This form is not accepting responses.')
  if (form.expiresAt && form.expiresAt <= new Date()) return closed(410, 'expired', 'This form has expired.')
  if (form.submissionLimit && (await FormResponse.countDocuments({ form: form._id })) >= form.submissionLimit) return closed(410, 'limit_reached', 'This form has reached its submission limit.')
  return { form, err: null }
}

r.get('/forms/:id', async (req, res) => {
  const o = await openForm(String(req.params.id))
  if (o.err) { res.status(o.err.status).json({ code: o.err.code, message: o.err.message, title: o.err.title }); return }
  await Form.updateOne({ _id: o.form._id }, { $inc: { views: 1 } }) // powers the completion rate
  const { id, title, description, accent, fields } = o.form.toJSON()
  res.json({ id, title, description, accent, fields })
})

r.post('/forms/:id/responses', async (req, res) => {
  const o = await openForm(String(req.params.id))
  if (o.err) { res.status(o.err.status).json({ code: o.err.code, message: o.err.message }); return }
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const { errors, clean } = checkAnswers(o.form.fields, body.answers && typeof body.answers === 'object' ? body.answers : {})
  if (Object.keys(errors).length) { res.status(422).json({ code: 'invalid', errors }); return }
  const secs = Number(body.completionSeconds)
  await FormResponse.create({ form: o.form._id, answers: clean, completionSeconds: Number.isFinite(secs) && secs >= 0 && secs < 86400 ? Math.round(secs) : null })
  res.status(201).json({ ok: true })
})

module.exports = r
