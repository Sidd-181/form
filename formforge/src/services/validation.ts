import type { Field } from '../types'
import type { Answer } from '../components/FieldInput'

// Client-side mirror of the server's rules (server/src/validate.js). The server remains the source of truth.
export function validateField(f: Field, v: Answer | undefined): string | null {
  const empty = v === undefined || v === '' || v === false || (Array.isArray(v) && v.length === 0)
  if (empty) return f.required ? 'This field is required' : null
  const s = String(v).trim()
  switch (f.type) {
    case 'short_text': case 'long_text':
      if (f.min != null && s.length < f.min) return `Must be at least ${f.min} characters`
      if (f.max != null && s.length > f.max) return `Must be at most ${f.max} characters`
      return null
    case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? null : 'Enter a valid email address'
    case 'phone': return /^[+\d][\d\s()-]{5,19}$/.test(s) ? null : 'Enter a valid phone number'
    case 'number': {
      const n = Number(s)
      if (!Number.isFinite(n)) return 'Enter a valid number'
      if (f.min != null && n < f.min) return `Must be at least ${f.min}`
      if (f.max != null && n > f.max) return `Must be at most ${f.max}`
      return null
    }
    case 'date': return Number.isNaN(Date.parse(s)) ? 'Enter a valid date' : null
    default: return null
  }
}
export function validateAll(fields: Field[], values: Record<string, Answer>) {
  const errors: Record<string, string> = {}
  for (const f of fields) { const e = validateField(f, values[f.id]); if (e) errors[f.id] = e }
  return errors
}
