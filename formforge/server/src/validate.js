const { z } = require('zod')

const TYPES = ['short_text', 'long_text', 'email', 'number', 'phone', 'dropdown', 'multiple_choice', 'checkbox', 'date', 'rating', 'file']
const fieldSchema = z.object({
  id: z.string().min(1).max(40), type: z.enum(TYPES), label: z.string().max(300),
  description: z.string().max(1000).optional(), placeholder: z.string().max(300).optional(), required: z.boolean(),
  options: z.array(z.string().max(200)).max(100).optional(), min: z.number().optional(), max: z.number().optional(),
})
const formBody = z.object({
  title: z.string().trim().min(1).max(200), description: z.string().max(2000).optional(),
  fields: z.array(fieldSchema).max(100), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  submissionLimit: z.number().int().positive().nullable().optional(), expiresAt: z.string().datetime().nullable().optional(),
})

// Server-side re-validation of a submission against the form's field config. Never trust the client.
function checkAnswers(fields, raw) {
  const errors = {}
  const clean = {}
  for (const f of fields) {
    const v = raw[f.id]
    const empty = v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0)
    if (empty) { if (f.required) errors[f.id] = 'This field is required'; continue }
    const s = String(v).trim()
    const bad = m => { errors[f.id] = m }
    switch (f.type) {
      case 'short_text': case 'long_text':
        if (s.length > 5000) bad('Too long')
        else if (f.min != null && s.length < f.min) bad(`Must be at least ${f.min} characters`)
        else if (f.max != null && s.length > f.max) bad(`Must be at most ${f.max} characters`)
        else clean[f.id] = s
        break
      case 'email': /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254 ? (clean[f.id] = s) : bad('Enter a valid email address'); break
      case 'phone': /^[+\d][\d\s()-]{5,19}$/.test(s) ? (clean[f.id] = s) : bad('Enter a valid phone number'); break
      case 'number': {
        const n = Number(s)
        if (!Number.isFinite(n)) bad('Enter a valid number')
        else if (f.min != null && n < f.min) bad(`Must be at least ${f.min}`)
        else if (f.max != null && n > f.max) bad(`Must be at most ${f.max}`)
        else clean[f.id] = n
        break
      }
      case 'dropdown': case 'multiple_choice': (f.options ?? []).includes(s) ? (clean[f.id] = s) : bad('Choose one of the available options'); break
      case 'checkbox': clean[f.id] = 'Yes'; break
      case 'date': Number.isNaN(Date.parse(s)) ? bad('Enter a valid date') : (clean[f.id] = s); break
      case 'rating': {
        const n = Number(s)
        Number.isInteger(n) && n >= 1 && n <= (f.max ?? 5) ? (clean[f.id] = n) : bad('Choose a rating'); break
      }
      case 'file': s.length <= 300 ? (clean[f.id] = s) : bad('Invalid file'); break // file bytes are not stored yet; only the file name
    }
  }
  return { errors, clean }
}

module.exports = { TYPES, fieldSchema, formBody, checkAnswers }
