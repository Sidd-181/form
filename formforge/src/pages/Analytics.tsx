import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import WithForm from '../components/WithForm'
import FormTabs from '../components/FormTabs'
import { Button, cn } from '../components/ui'
import { fetchForm, useAppDispatch } from '../store'
import { useResponses } from '../services/responses'
import type { Form, FormResponse } from '../types'

const PRESETS = [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['0', 'All time']] as const
const DAY = 86400000
const pad = (n: number) => String(n).padStart(2, '0')

function buildTrend(rows: FormResponse[], days: number) {
  if (!rows.length) return []
  const end = new Date()
  const start = days ? new Date(Date.now() - (days - 1) * DAY) : new Date(Math.min(...rows.map(r => new Date(r.submittedAt).getTime())))
  const monthly = Math.ceil((end.getTime() - start.getTime()) / DAY) + 1 > 92
  const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}${monthly ? '' : `-${pad(d.getDate())}`}`
  const buckets = new Map<string, { label: string; count: number }>()
  const cur = new Date(start.getFullYear(), start.getMonth(), monthly ? 1 : start.getDate())
  while (cur <= end) {
    buckets.set(key(cur), { label: cur.toLocaleDateString(undefined, monthly ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' }), count: 0 })
    if (monthly) cur.setMonth(cur.getMonth() + 1); else cur.setDate(cur.getDate() + 1)
  }
  rows.forEach(r => { const b = buckets.get(key(new Date(r.submittedAt))); if (b) b.count++ })
  return [...buckets.values()]
}

const fmtDuration = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`)

const Metric = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-xl border border-line bg-white p-5"><p className="text-sm text-neutral-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>{hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}</div>
)

function ChartCard({ title, subtitle, summary, children }: { title: string; subtitle?: string; summary: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="font-medium">{title}</h2>{subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
      <div role="img" aria-label={summary} className="mt-4 h-60">{children}</div>
    </section>
  )
}

function Bars({ data, color, horizontal }: { data: { name: string; count: number }[]; color: string; horizontal?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: horizontal ? 8 : -20, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={!horizontal} vertical={!!horizontal} />
        {horizontal ? <><XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} /><YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 12 }} /></>
          : <><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /></>}
        <Tooltip cursor={{ fill: '#f5f5f5' }} />
        <Bar dataKey="count" name="Responses" fill={color} radius={4} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function AnalyticsView({ form }: { form: Form }) {
  const dispatch = useAppDispatch()
  const { data, error, reload } = useResponses(form.id)
  const [days, setDays] = useState(30)
  useEffect(() => { dispatch(fetchForm(form.id)) }, [dispatch, form.id]) // refresh visit count

  const rows = useMemo(() => {
    const since = days ? Date.now() - days * DAY : 0
    return (data ?? []).filter(r => new Date(r.submittedAt).getTime() >= since)
  }, [data, days])
  const trend = useMemo(() => buildTrend(rows, days), [rows, days])
  const times = rows.map(r => r.completionSeconds).filter((n): n is number => typeof n === 'number')
  const avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null
  const views = form.views ?? 0
  const rate = views > 0 && data ? Math.min(100, Math.round((data.length / views) * 100)) : null

  const ratings = form.fields.filter(f => f.type === 'rating').map(f => {
    const vals = rows.map(r => Number(r.answers[f.id])).filter(n => n >= 1)
    return { f, n: vals.length, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
      data: Array.from({ length: f.max ?? 5 }, (_, i) => ({ name: String(i + 1), count: vals.filter(v => v === i + 1).length })) }
  })
  const choices = form.fields.filter(f => f.type === 'multiple_choice' || f.type === 'dropdown').map(f => ({
    f, data: (f.options ?? []).map(o => ({ name: o, count: rows.filter(r => r.answers[f.id] === o).length })),
  }))

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">{form.title}</h1><p className="mt-1 text-sm text-neutral-500">Analytics</p></div>
      <FormTabs id={form.id} />
      {error ? (
        <div role="alert" className="rounded-xl border border-line bg-white p-10 text-center"><p className="font-medium">Couldn't load analytics</p><p className="mt-1 text-sm text-neutral-500">{error}</p><Button className="mt-4" onClick={reload}>Try again</Button></div>
      ) : !data ? (
        <p className="rounded-xl border border-line bg-white p-10 text-center text-sm text-neutral-500">Loading analytics…</p>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
          <p className="font-medium">No analytics yet</p>
          <p className="mt-1 text-sm text-neutral-500">Charts appear once your form receives its first response.</p>
          <Link to={`/app/forms/${form.id}/share`}><Button className="mt-4">{form.status === 'published' ? 'Get the link' : 'Publish & share'}</Button></Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
            {PRESETS.map(([d, l]) => <button key={d} aria-pressed={days === Number(d)} onClick={() => setDays(Number(d))} className={cn('rounded-full border px-3 py-1.5 text-sm', days === Number(d) ? 'border-ink bg-ink text-white' : 'border-line bg-white text-neutral-600')}>{l}</button>)}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Total submissions" value={String(rows.length)} hint={days ? `of ${data.length} all time` : undefined} />
            <Metric label="Completion rate" value={rate === null ? '–' : `${rate}%`} hint={rate === null ? 'Available after the public form has been opened' : `${data.length} responses from ${views} form views (all time)`} />
            <Metric label="Avg. completion time" value={avgTime === null ? '–' : fmtDuration(avgTime)} hint={avgTime === null ? 'No timing data in this period' : `Across ${times.length} responses`} />
          </div>
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center"><p className="font-medium">No responses in this period</p><p className="mt-1 text-sm text-neutral-500">Try a longer date range.</p></div>
          ) : (
            <>
              <ChartCard title="Response trend" subtitle="Submissions over time" summary={`Line chart of submissions over time, ${rows.length} in total`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ left: -20, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" name="Submissions" stroke={form.accent} strokeWidth={2} dot={trend.length < 20} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <div className="grid gap-4 lg:grid-cols-2">
                {ratings.map(({ f, data: d, avg, n }) => (
                  <ChartCard key={f.id} title={f.label} subtitle={avg === null ? 'No ratings yet' : `Average ${avg.toFixed(1)} from ${n} ratings`} summary={`Bar chart of rating distribution for ${f.label}`}><Bars data={d} color={form.accent} /></ChartCard>
                ))}
                {choices.map(({ f, data: d }) => (
                  <ChartCard key={f.id} title={f.label} subtitle="Answer distribution" summary={`Bar chart of answers for ${f.label}`}><Bars data={d} color={form.accent} horizontal /></ChartCard>
                ))}
              </div>
              {ratings.length + choices.length === 0 && <p className="text-sm text-neutral-500">Add rating, dropdown or multiple-choice fields to see answer distributions.</p>}
            </>
          )}
        </>
      )}
    </div>
  )
}
export default function Analytics() { return <WithForm>{f => <AnalyticsView form={f} />}</WithForm> }
