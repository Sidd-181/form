import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, LayoutGrid, List, Pencil, Eye, Inbox, Copy, Trash2, FileText, Globe, MessageSquare } from 'lucide-react'
import { useAppDispatch, useAppSelector, duplicateForm, removeForm, setStatus, loadDashboard } from '../store'
import { Button, Input, Badge, Dialog, cn } from '../components/ui'
import type { Form } from '../types'

const timeAgo = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 60) return `${Math.max(m, 1)}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof FileText }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-center justify-between text-sm text-neutral-500">{label}<Icon size={16} /></div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}

type Pending = { kind: 'delete' | 'publish' | 'unpublish'; form: Form; error?: string } | null

export default function Dashboard() {
  const forms = useAppSelector(s => s.forms)
  const responses = useAppSelector(s => s.responses)
  const load = useAppSelector(s => s.load)
  const loadError = useAppSelector(s => s.loadError)
  const user = useAppSelector(s => s.auth.user)
  const dispatch = useAppDispatch()
  useEffect(() => { dispatch(loadDashboard()) }, [dispatch])
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [pending, setPending] = useState<Pending>(null)

  const visible = useMemo(() => forms.filter(f =>
    (status === 'all' || f.status === status) && f.title.toLowerCase().includes(query.trim().toLowerCase())), [forms, query, status])

  const activity = useMemo(() => {
    const title = (id: string) => forms.find(f => f.id === id)?.title ?? 'a form'
    return [
      ...forms.map(f => ({ at: f.updatedAt, text: `${f.title} was ${f.status === 'published' ? 'published' : 'updated'}` })),
      ...responses.map(r => ({ at: r.submittedAt, text: `New response on ${title(r.formId)}` })),
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6)
  }, [forms, responses])

  const confirm = async () => {
    if (!pending) return
    const { kind, form } = pending
    try {
      if (kind === 'delete') await dispatch(removeForm(form.id)).unwrap()
      else await dispatch(setStatus({ id: form.id, status: kind === 'publish' ? 'published' : 'draft' })).unwrap()
      setPending(null)
    } catch (e) { setPending(p => p && { ...p, error: (e as { message?: string }).message ?? 'Something went wrong' }) }
  }

  const actions = (f: Form) => (
    <div className="flex items-center gap-1">
      {[
        { label: 'Edit', icon: Pencil, run: () => navigate(`/app/forms/${f.id}/edit`) },
        { label: 'Preview', icon: Eye, run: () => navigate(`/app/forms/${f.id}/preview`) },
        { label: 'View responses', icon: Inbox, run: () => navigate(`/app/forms/${f.id}/responses`) },
        { label: 'Duplicate', icon: Copy, run: () => dispatch(duplicateForm(f.id)) },
        { label: 'Delete', icon: Trash2, run: () => setPending({ kind: 'delete', form: f }) },
      ].map(a => (
        <button key={a.label} title={a.label} aria-label={a.label} onClick={a.run} className="grid h-8 w-8 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-ink"><a.icon size={16} /></button>
      ))}
      <Button size="sm" variant="secondary" className="ml-1" onClick={() => setPending({ kind: f.status === 'published' ? 'unpublish' : 'publish', form: f })}>
        {f.status === 'published' ? 'Unpublish' : 'Publish'}
      </Button>
    </div>
  )

  const statusBadge = (f: Form) => <Badge tone={f.status === 'published' ? 'green' : 'neutral'}>{f.status === 'published' ? 'Published' : 'Draft'}</Badge>

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-neutral-500">Build, publish and analyze your forms in one place.</p>
        </div>
        <Link to="/app/forms/new"><Button><Plus size={16} />Create new form</Button></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Total forms" value={forms.length} icon={FileText} />
        <Metric label="Total responses" value={forms.reduce((n, f) => n + (f.responseCount ?? 0), 0)} icon={MessageSquare} />
        <Metric label="Published forms" value={forms.filter(f => f.status === 'published').length} icon={Globe} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search size={16} className="absolute left-3 top-3 text-neutral-400" />
              <Input aria-label="Search forms" placeholder="Search forms" className="pl-9" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <div className="flex rounded-lg border border-line bg-white p-0.5" role="group" aria-label="Filter by status">
              {(['all', 'draft', 'published'] as const).map(s => (
                <button key={s} onClick={() => setFilter(s)} className={cn('rounded-md px-3 py-1.5 text-sm capitalize', status === s ? 'bg-ink text-white' : 'text-neutral-600')}>{s}</button>
              ))}
            </div>
            <div className="flex rounded-lg border border-line bg-white p-0.5" role="group" aria-label="View mode">
              {([['grid', LayoutGrid], ['list', List]] as const).map(([v, Icon]) => (
                <button key={v} aria-label={`${v} view`} aria-pressed={view === v} onClick={() => setView(v)} className={cn('grid h-8 w-8 place-items-center rounded-md', view === v ? 'bg-ink text-white' : 'text-neutral-600')}><Icon size={16} /></button>
              ))}
            </div>
          </div>

          {load === 'error' ? (
            <div className="rounded-xl border border-line bg-white p-10 text-center" role="alert">
              <p className="font-medium">Couldn't load your forms</p>
              <p className="mt-1 text-sm text-neutral-500">{loadError}</p>
              <Button className="mt-4" onClick={() => dispatch(loadDashboard())}>Try again</Button>
            </div>
          ) : load !== 'ready' && forms.length === 0 ? (
            <p className="rounded-xl border border-line bg-white p-10 text-center text-sm text-neutral-500">Loading your forms…</p>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
              <p className="font-medium">{forms.length === 0 ? 'No forms yet' : 'No forms match your search'}</p>
              <p className="mt-1 text-sm text-neutral-500">{forms.length === 0 ? 'Create your first form from a template or from scratch.' : 'Try a different search term or status filter.'}</p>
              {forms.length === 0 && <Link to="/app/forms/new"><Button className="mt-4">Create new form</Button></Link>}
            </div>
          ) : view === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {visible.map(f => (
                <article key={f.id} className="flex flex-col rounded-xl border border-line bg-white p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/app/forms/${f.id}/edit`} className="font-medium hover:text-accent-600">{f.title}</Link>{statusBadge(f)}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{f.description || 'No description'}</p>
                  <p className="mt-4 text-xs text-neutral-500">{f.fields.length} fields · {(f.responseCount ?? 0)} responses · Updated {timeAgo(f.updatedAt)}</p>
                  <div className="mt-4 border-t border-line pt-3">{actions(f)}</div>
                </article>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-line overflow-x-auto rounded-xl border border-line bg-white">
              {visible.map(f => (
                <div key={f.id} className="flex min-w-[640px] items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <Link to={`/app/forms/${f.id}/edit`} className="font-medium hover:text-accent-600">{f.title}</Link>
                    <p className="text-xs text-neutral-500">{(f.responseCount ?? 0)} responses · Updated {timeAgo(f.updatedAt)}</p>
                  </div>
                  {statusBadge(f)}{actions(f)}
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-line bg-white p-5">
          <h2 className="font-medium">Recent activity</h2>
          {activity.length === 0 ? <p className="mt-3 text-sm text-neutral-500">Nothing yet.</p> : (
            <ul className="mt-4 space-y-4">
              {activity.map((a, i) => (
                <li key={i} className="text-sm"><p>{a.text}</p><p className="text-xs text-neutral-500">{timeAgo(a.at)}</p></li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <Dialog open={!!pending} onClose={() => setPending(null)}
        title={pending?.kind === 'delete' ? 'Delete form?' : pending?.kind === 'publish' ? 'Publish form?' : 'Unpublish form?'}>
        <p>
          {pending?.kind === 'delete' && `"${pending.form.title}" and all of its responses will be permanently deleted.`}
          {pending?.kind === 'publish' && `"${pending.form.title}" will become publicly accessible and start accepting responses.`}
          {pending?.kind === 'unpublish' && `"${pending.form.title}" will stop accepting responses. Existing responses are kept.`}
        </p>
        {pending?.error && <p role="alert" className="mt-3 text-red-600">{pending.error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPending(null)}>Cancel</Button>
          <Button variant={pending?.kind === 'delete' ? 'danger' : 'primary'} onClick={confirm}>
            {pending?.kind === 'delete' ? 'Delete' : pending?.kind === 'publish' ? 'Publish' : 'Unpublish'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
