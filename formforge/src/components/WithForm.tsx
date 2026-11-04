import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { fetchForm, useAppDispatch, useAppSelector } from '../store'
import type { Form } from '../types'

// Resolves the :id route param to a form (from the store, or fetched), with loading and not-found states.
export default function WithForm({ children }: { children: (f: Form) => ReactNode }) {
  const { id = '' } = useParams()
  const dispatch = useAppDispatch()
  const form = useAppSelector(s => s.forms.find(f => f.id === id))
  const [missing, setMissing] = useState(false)
  useEffect(() => { if (!form) dispatch(fetchForm(id)).unwrap().catch(() => setMissing(true)) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (form) return <>{children(form)}</>
  if (!missing) return <div className="grid min-h-[40vh] place-items-center text-neutral-500"><Loader2 className="animate-spin" /></div>
  return <div className="py-20 text-center"><p className="font-medium">Form not found</p><Link to="/app" className="text-sm text-accent-600">Back to dashboard</Link></div>
}
