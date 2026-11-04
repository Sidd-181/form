import { Link } from 'react-router-dom'
import { BarChart3, Check, GripVertical, Link2, ListChecks, Palette, ShieldCheck, Star } from 'lucide-react'
import { Logo } from '../components/AppLayout'
import { useAppSelector } from '../store'
import { TEMPLATES } from '../services/templates'
import { FIELD_TYPES } from '../services/fieldTypes'
import { Button } from '../components/ui'

const FEATURES = [
  { icon: GripVertical, title: 'Drag-and-drop builder', text: 'Eleven field types, reorderable on a live canvas, with undo, redo and autosave.' },
  { icon: ListChecks, title: 'Validation built in', text: 'Required fields, length and range limits, and email and phone checks, enforced on the server too.' },
  { icon: Link2, title: 'Share anywhere', text: 'Publish to a public link, embed it with an iframe, and set a submission limit or expiry date.' },
  { icon: BarChart3, title: 'Real analytics', text: 'Response trends, rating and choice breakdowns, completion rate and average time.' },
  { icon: Palette, title: 'Make it yours', text: 'Pick an accent colour and preview on desktop and mobile before you publish.' },
  { icon: ShieldCheck, title: 'Your data, exportable', text: 'Search and filter responses, then export them as CSV whenever you need.' },
]
const STEPS = [['Build', 'Start from a template or a blank form and add the fields you need.'], ['Publish', 'Preview it, then publish to get a public link and embed code.'], ['Learn', 'Review responses and watch the analytics fill in.']]
const PLANS = [
  { name: 'Free', price: '$0', note: 'For trying things out', items: ['Unlimited forms', 'Public links and embeds', 'CSV export'], cta: 'Get started' },
  { name: 'Pro', price: '$12', note: 'per month, for individuals', items: ['Everything in Free', 'Submission limits and expiry', 'Full analytics'], cta: 'Start with Pro', featured: true },
  { name: 'Team', price: '$29', note: 'per month, for small teams', items: ['Everything in Pro', 'Shared workspace', 'Priority support'], cta: 'Start with Team' },
]
const FAQ = [
  ['Is FormForge free to use?', 'Yes. The Free plan covers unlimited forms and responses. Paid plans add team and control features.'],
  ['Can I embed a form on my own website?', 'Yes. Every published form has a public link and a ready-to-copy iframe embed code.'],
  ['Can I limit or close a form?', 'You can set a maximum number of responses and an expiry date. The form closes automatically when either is reached.'],
  ['How do I get my data out?', 'Open the Responses page, filter if you like, and choose Export CSV.'],
]
const nav = [['Features', '#features'], ['Templates', '#templates'], ['Pricing', '#pricing']]

function ProductPreview() {
  return (
    <div aria-hidden="true" className="rounded-2xl p-3 sm:p-6" style={{ background: 'linear-gradient(135deg, #e0e7ff, #fce7f3 60%, #ffedd5)' }}>
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">{[0, 1, 2].map(i => <span key={i} className="h-2.5 w-2.5 rounded-full bg-neutral-200" />)}<span className="ml-3 text-xs text-neutral-500">Customer satisfaction</span></div>
        <div className="grid md:grid-cols-[180px_1fr_200px]">
          <div className="hidden space-y-2 border-r border-line p-4 md:block">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Fields</p>
            {FIELD_TYPES.slice(0, 6).map(f => <div key={f.type} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs"><f.icon size={14} />{f.label}</div>)}
          </div>
          <div className="dot-grid p-4 sm:p-6">
            <div className="mx-auto max-w-sm space-y-3">
              <div className="rounded-xl border border-line bg-white p-4" style={{ borderTop: '4px solid #4f46e5' }}><p className="font-semibold">Customer satisfaction</p><p className="text-xs text-neutral-500">Tell us how we did.</p></div>
              <div className="rounded-xl border border-accent-500 bg-white p-4 ring-2 ring-accent-100"><p className="text-sm font-medium">Your name</p><div className="mt-2 h-9 rounded-lg border border-line" /></div>
              <div className="rounded-xl border border-line bg-white p-4"><p className="text-sm font-medium">How satisfied are you?</p><div className="mt-2 flex gap-1 text-accent-600">{[0, 1, 2, 3].map(i => <Star key={i} size={20} fill="currentColor" />)}<Star size={20} className="text-neutral-300" /></div></div>
            </div>
          </div>
          <div className="hidden space-y-3 border-l border-line p-4 md:block">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Properties</p>
            <div className="h-9 rounded-lg border border-line px-3 py-2 text-xs">Your name</div>
            <div className="flex items-center justify-between text-xs">Required<span className="relative h-5 w-9 rounded-full bg-accent-600"><span className="absolute left-[18px] top-0.5 h-4 w-4 rounded-full bg-white" /></span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const signedIn = useAppSelector(s => s.auth.status) !== 'anon'
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav aria-label="Primary" className="hidden gap-8 text-sm font-medium text-neutral-600 md:flex">{nav.map(([l, h]) => <a key={l} href={h} className="hover:text-ink">{l}</a>)}</nav>
          <div className="flex items-center gap-2">
            {signedIn ? <Link to="/app"><Button size="sm">Open dashboard</Button></Link> : <>
              <Link to="/login" className="px-3 text-sm font-medium text-neutral-600 hover:text-ink">Login</Link>
              <Link to="/signup"><Button size="sm" className="rounded-full">Get Started</Button></Link></>}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pt-24">
          <span className="inline-flex items-center rounded-full border border-line px-3 py-1 text-xs font-medium text-neutral-600">Form builder for teams that ship</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">Forms people actually finish.</h1>
          <p className="mt-5 max-w-xl text-lg text-neutral-600">Build, publish and analyze forms in one place. Collect signups, feedback and applications without writing code.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={signedIn ? '/app/forms/new' : '/signup'}><Button className="h-12 rounded-full px-6 text-base">{signedIn ? 'Create a form' : 'Get started, it\'s free'}</Button></Link>
            <a href="#how"><Button variant="secondary" className="h-12 rounded-full px-6 text-base">See how it works</Button></a>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6"><ProductPreview /></section>

        <section id="features" className="border-t border-line bg-canvas py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">Everything from first field to final report</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(f => <div key={f.title} className="rounded-xl border border-line bg-white p-6"><span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-50 text-accent-600"><f.icon size={20} /></span><h3 className="mt-4 font-medium">{f.title}</h3><p className="mt-1 text-sm text-neutral-600">{f.text}</p></div>)}
            </div>
          </div>
        </section>

        <section id="templates" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">Start from a template</h2>
            <p className="mt-2 text-neutral-600">Six ready-made forms you can customize in minutes.</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map(t => (
                <Link key={t.id} to={signedIn ? '/app/forms/new' : '/signup'} className="rounded-xl border border-line bg-white p-5 transition-colors hover:border-accent-500">
                  <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">{t.category}</span>
                  <h3 className="mt-3 font-medium">{t.title}</h3><p className="mt-1 text-sm text-neutral-600">{t.description}</p><p className="mt-3 text-xs text-neutral-500">{t.fields.length} fields</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="border-t border-line bg-canvas py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map(([t, d], i) => <li key={t} className="rounded-xl border border-line bg-white p-6"><span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-sm font-semibold text-white">{i + 1}</span><h3 className="mt-4 font-medium">{t}</h3><p className="mt-1 text-sm text-neutral-600">{d}</p></li>)}
            </ol>
          </div>
        </section>

        <section id="pricing" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">Simple pricing</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {PLANS.map(p => (
                <div key={p.name} className={`flex flex-col rounded-xl border bg-white p-6 ${p.featured ? 'border-accent-500 ring-2 ring-accent-100' : 'border-line'}`}>
                  <h3 className="font-medium">{p.name}</h3>
                  <p className="mt-3 text-4xl font-semibold tracking-tight">{p.price}</p><p className="text-sm text-neutral-500">{p.note}</p>
                  <ul className="mt-5 flex-1 space-y-2 text-sm">{p.items.map(i => <li key={i} className="flex items-center gap-2"><Check size={16} className="text-accent-600" />{i}</li>)}</ul>
                  <Link to="/signup" className="mt-6"><Button variant={p.featured ? 'primary' : 'secondary'} className="w-full">{p.cta}</Button></Link>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-neutral-500">Billing is not connected in this build, so every account currently has full access.</p>
          </div>
        </section>

        <section id="faq" className="border-t border-line bg-canvas py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
            <div className="mt-8 divide-y divide-line rounded-xl border border-line bg-white">
              {FAQ.map(([q, a]) => <details key={q} className="group p-5"><summary className="cursor-pointer list-none font-medium after:float-right after:text-neutral-400 after:content-['+'] group-open:after:content-['–']">{q}</summary><p className="mt-2 text-sm text-neutral-600">{a}</p></details>)}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-neutral-500 sm:px-6">
          <Logo /><nav aria-label="Footer" className="flex gap-6">{nav.map(([l, h]) => <a key={l} href={h} className="hover:text-ink">{l}</a>)}<Link to="/login" className="hover:text-ink">Login</Link></nav>
          <p>© {new Date().getFullYear()} FormForge</p>
        </div>
      </footer>
    </div>
  )
}
