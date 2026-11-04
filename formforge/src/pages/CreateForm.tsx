import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAppDispatch, useAppSelector, createForm } from '../store'
import { CATEGORIES, TEMPLATES, buildForm, type Template } from '../services/templates'
import { Button, cn } from '../components/ui'

export default function CreateForm() {
  const [cat, setCat] = useState('All')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const defaultAccent = useAppSelector(s => s.auth.user?.defaultAccent)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const create = async (t?: Template) => {
    setBusy(true); setError(null)
    const { title, description, fields, accent } = buildForm(t)
    try { const f = await dispatch(createForm({ title, description, fields, accent: defaultAccent ?? accent })).unwrap(); navigate(`/app/forms/${f.id}/edit`) }
    catch (e) { setError((e as { message?: string }).message ?? 'Could not create the form'); setBusy(false) }
  }
  const list = TEMPLATES.filter(t => cat === 'All' || t.category === cat)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create a form</h1>
        <p className="mt-1 text-sm text-neutral-500">Start from scratch or pick a template and customize it.</p>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Template categories">
        {['All', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
            className={cn('rounded-full border px-3 py-1.5 text-sm', cat === c ? 'border-ink bg-ink text-white' : 'border-line bg-white text-neutral-600 hover:bg-neutral-50')}>{c}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button disabled={busy} onClick={() => create()} className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white p-5 text-center hover:border-accent-500">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-50 text-accent-600"><Plus size={20} /></span>
          <span className="font-medium">Start from scratch</span>
          <span className="text-sm text-neutral-500">A blank form with one field</span>
        </button>
        {list.map(t => (
          <article key={t.id} className="flex flex-col rounded-xl border border-line bg-white p-5">
            <span className="w-fit rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">{t.category}</span>
            <h2 className="mt-3 font-medium">{t.title}</h2>
            <p className="mt-1 flex-1 text-sm text-neutral-500">{t.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-neutral-500">{t.fields.length} fields</span>
              <Button size="sm" disabled={busy} onClick={() => create(t)}>Use template</Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
