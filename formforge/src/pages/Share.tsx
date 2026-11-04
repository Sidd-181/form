import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Check, Eye, Inbox, Mail, MessageCircle, Share2, Send } from 'lucide-react'
import WithForm from '../components/WithForm'
import { Badge, Button, Dialog, Input } from '../components/ui'
import { setStatus, updateSettings, useAppDispatch } from '../store'
import type { Form } from '../types'

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3 rounded-xl border border-line bg-white p-5"><h2 className="font-medium">{title}</h2>{children}</section>
)

function CopyBox({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const copy = () => {
    if (!navigator.clipboard) { setState('failed'); return }
    navigator.clipboard.writeText(value).then(() => { setState('copied'); setTimeout(() => setState('idle'), 1800) }).catch(() => setState('failed'))
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2">
        {multiline
          ? <textarea readOnly aria-label={label} value={value} rows={3} onFocus={e => e.target.select()} className="w-full resize-none rounded-lg border border-line bg-neutral-50 p-3 font-mono text-xs" />
          : <Input readOnly aria-label={label} value={value} onFocus={e => e.target.select()} className="bg-neutral-50" />}
        <Button variant="secondary" onClick={copy} className="shrink-0">{state === 'copied' ? <><Check size={16} />Copied</> : <><Copy size={16} />Copy</>}</Button>
      </div>
      {state === 'failed' && <p role="alert" className="text-xs text-red-600">Couldn't copy automatically. Select the text and copy it manually.</p>}
    </div>
  )
}

const toLocalInput = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function Limits({ form }: { form: Form }) {
  const dispatch = useAppDispatch()
  const [limit, setLimit] = useState(form.submissionLimit ? String(form.submissionLimit) : '')
  const [expires, setExpires] = useState(toLocalInput(form.expiresAt))
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const save = async () => {
    const n = limit.trim() === '' ? null : Number(limit)
    if (n !== null && (!Number.isInteger(n) || n < 1)) { setMsg({ ok: false, text: 'Submission limit must be a whole number of 1 or more.' }); return }
    try {
      await dispatch(updateSettings({ id: form.id, submissionLimit: n, expiresAt: expires ? new Date(expires).toISOString() : null })).unwrap()
      setMsg({ ok: true, text: 'Settings saved.' })
    } catch (e) { setMsg({ ok: false, text: (e as { message?: string }).message ?? 'Could not save settings.' }) }
  }
  return (
    <Card title="Submission limit and expiration">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5"><span className="text-xs font-medium text-neutral-600">Maximum responses (blank = unlimited)</span>
          <Input type="number" min={1} value={limit} onChange={e => setLimit(e.target.value)} placeholder="Unlimited" /></label>
        <label className="block space-y-1.5"><span className="text-xs font-medium text-neutral-600">Close form on (blank = never)</span>
          <Input type="datetime-local" value={expires} onChange={e => setExpires(e.target.value)} /></label>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save}>Save settings</Button>
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'text-sm text-emerald-700' : 'text-sm text-red-600'}>{msg.text}</p>}
      </div>
      <p className="text-xs text-neutral-500">{form.responseCount ?? 0} responses so far. The form closes automatically when either condition is met.</p>
    </Card>
  )
}

function ShareView({ form }: { form: Form }) {
  const dispatch = useAppDispatch()
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const published = form.status === 'published'
  const url = `${window.location.origin}/forms/${form.id}`
  const embed = `<iframe src="${url}" width="100%" height="720" style="border:0" title="${form.title.replace(/"/g, '&quot;')}"></iframe>`
  const enc = encodeURIComponent
  const links = [
    { label: 'Email', icon: Mail, href: `mailto:?subject=${enc(form.title)}&body=${enc(url)}` },
    { label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/?text=${enc(`${form.title} ${url}`)}` },
    { label: 'X', icon: Send, href: `https://twitter.com/intent/tweet?text=${enc(form.title)}&url=${enc(url)}` },
    { label: 'LinkedIn', icon: Share2, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
  ]
  const toggle = async () => {
    setError(null)
    try { await dispatch(setStatus({ id: form.id, status: published ? 'draft' : 'published' })).unwrap(); setConfirm(false) }
    catch (e) { setError((e as { message?: string }).message ?? 'Something went wrong') }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Publish & share</h1>
          <p className="mt-1 text-sm text-neutral-500">{form.title}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/app/forms/${form.id}/preview`}><Button variant="secondary" size="sm"><Eye size={14} />Preview</Button></Link>
          <Link to={`/app/forms/${form.id}/responses`}><Button variant="secondary" size="sm"><Inbox size={14} />Responses</Button></Link>
        </div>
      </div>

      <Card title="Status">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Badge tone={published ? 'green' : 'neutral'}>{published ? 'Published' : 'Draft'}</Badge>
            <p className="text-sm text-neutral-600">{published ? 'Anyone with the link can respond.' : 'Publish to make the link work and start collecting responses.'}</p>
          </div>
          <Button variant={published ? 'secondary' : 'primary'} onClick={() => { setError(null); setConfirm(true) }}>{published ? 'Unpublish' : 'Publish'}</Button>
        </div>
      </Card>

      <Card title="Public link">
        <CopyBox label="Public form URL" value={url} />
        {!published && <p className="text-xs text-amber-700">This link shows a "closed" message until the form is published.</p>}
        {window.location.hostname === 'localhost' && <p className="text-xs text-neutral-500">This is a localhost link, so only you can open it. Deploy the app to share it publicly.</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          {links.map(l => <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-neutral-50"><l.icon size={14} />{l.label}</a>)}
        </div>
      </Card>

      <Card title="Embed on your website"><CopyBox label="Embed code" value={embed} multiline /></Card>
      <Limits key={form.id} form={form} />

      <Dialog open={confirm} onClose={() => setConfirm(false)} title={published ? 'Unpublish form?' : 'Publish form?'}>
        <p>{published ? 'The public link will stop accepting responses. Existing responses are kept.' : 'The form becomes publicly accessible and starts accepting responses.'}</p>
        {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button><Button onClick={toggle}>{published ? 'Unpublish' : 'Publish'}</Button></div>
      </Dialog>
    </div>
  )
}
export default function Share() { return <WithForm>{f => <ShareView form={f} />}</WithForm> }
