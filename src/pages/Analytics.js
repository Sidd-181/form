import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import WithForm from '../components/WithForm.js';
import FormTabs from '../components/FormTabs.js';
import { Button, cn } from '../components/ui.js';
import { fetchForm, useAppDispatch } from '../store/index.js';
import { useResponses } from '../services/responses.js';
const PRESETS = [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['0', 'All time']];
const DAY = 86400000;
const pad = (n) => String(n).padStart(2, '0');
function buildTrend(rows, days) {
    if (!rows.length)
        return [];
    const end = new Date();
    const start = days ? new Date(Date.now() - (days - 1) * DAY) : new Date(Math.min(...rows.map(r => new Date(r.submittedAt).getTime())));
    const monthly = Math.ceil((end.getTime() - start.getTime()) / DAY) + 1 > 92;
    const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}${monthly ? '' : `-${pad(d.getDate())}`}`;
    const buckets = new Map();
    const cur = new Date(start.getFullYear(), start.getMonth(), monthly ? 1 : start.getDate());
    while (cur <= end) {
        buckets.set(key(cur), { label: cur.toLocaleDateString(undefined, monthly ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' }), count: 0 });
        if (monthly)
            cur.setMonth(cur.getMonth() + 1);
        else
            cur.setDate(cur.getDate() + 1);
    }
    rows.forEach(r => { const b = buckets.get(key(new Date(r.submittedAt))); if (b)
        b.count++; });
    return [...buckets.values()];
}
const fmtDuration = (s) => (s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`);
const Metric = ({ label, value, hint }) => (_jsxs("div", { className: "rounded-xl border border-line bg-white p-5", children: [_jsx("p", { className: "text-sm text-neutral-500", children: label }), _jsx("p", { className: "mt-2 text-3xl font-semibold tracking-tight", children: value }), hint && _jsx("p", { className: "mt-1 text-xs text-neutral-500", children: hint })] }));
function ChartCard({ title, subtitle, summary, children }) {
    return (_jsxs("section", { className: "rounded-xl border border-line bg-white p-5", children: [_jsx("h2", { className: "font-medium", children: title }), subtitle && _jsx("p", { className: "text-xs text-neutral-500", children: subtitle }), _jsx("div", { role: "img", "aria-label": summary, className: "mt-4 h-60", children: children })] }));
}
function Bars({ data, color, horizontal }) {
    return (_jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: data, layout: horizontal ? 'vertical' : 'horizontal', margin: { left: horizontal ? 8 : -20, right: 12 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb", horizontal: !horizontal, vertical: !!horizontal }), horizontal ? _jsxs(_Fragment, { children: [_jsx(XAxis, { type: "number", allowDecimals: false, tick: { fontSize: 12 } }), _jsx(YAxis, { type: "category", dataKey: "name", width: 96, tick: { fontSize: 12 } })] })
                    : _jsxs(_Fragment, { children: [_jsx(XAxis, { dataKey: "name", tick: { fontSize: 12 } }), _jsx(YAxis, { allowDecimals: false, tick: { fontSize: 12 } })] }), _jsx(Tooltip, { cursor: { fill: '#f5f5f5' } }), _jsx(Bar, { dataKey: "count", name: "Responses", fill: color, radius: 4 })] }) }));
}
function AnalyticsView({ form }) {
    const dispatch = useAppDispatch();
    const { data, error, reload } = useResponses(form.id);
    const [days, setDays] = useState(30);
    useEffect(() => { dispatch(fetchForm(form.id)); }, [dispatch, form.id]); // refresh visit count
    const rows = useMemo(() => {
        const since = days ? Date.now() - days * DAY : 0;
        return (data ?? []).filter(r => new Date(r.submittedAt).getTime() >= since);
    }, [data, days]);
    const trend = useMemo(() => buildTrend(rows, days), [rows, days]);
    const times = rows.map(r => r.completionSeconds).filter((n) => typeof n === 'number');
    const avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
    const views = form.views ?? 0;
    const rate = views > 0 && data ? Math.min(100, Math.round((data.length / views) * 100)) : null;
    const ratings = form.fields.filter(f => f.type === 'rating').map(f => {
        const vals = rows.map(r => Number(r.answers[f.id])).filter(n => n >= 1);
        return { f, n: vals.length, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
            data: Array.from({ length: f.max ?? 5 }, (_, i) => ({ name: String(i + 1), count: vals.filter(v => v === i + 1).length })) };
    });
    const choices = form.fields.filter(f => f.type === 'multiple_choice' || f.type === 'dropdown').map(f => ({
        f, data: (f.options ?? []).map(o => ({ name: o, count: rows.filter(r => r.answers[f.id] === o).length })),
    }));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: form.title }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: "Analytics" })] }), _jsx(FormTabs, { id: form.id }), error ? (_jsxs("div", { role: "alert", className: "rounded-xl border border-line bg-white p-10 text-center", children: [_jsx("p", { className: "font-medium", children: "Couldn't load analytics" }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: error }), _jsx(Button, { className: "mt-4", onClick: reload, children: "Try again" })] })) : !data ? (_jsx("p", { className: "rounded-xl border border-line bg-white p-10 text-center text-sm text-neutral-500", children: "Loading analytics\u2026" })) : data.length === 0 ? (_jsxs("div", { className: "rounded-xl border border-dashed border-line bg-white p-10 text-center", children: [_jsx("p", { className: "font-medium", children: "No analytics yet" }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: "Charts appear once your form receives its first response." }), _jsx(Link, { to: `/app/forms/${form.id}/share`, children: _jsx(Button, { className: "mt-4", children: form.status === 'published' ? 'Get the link' : 'Publish & share' }) })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex flex-wrap gap-2", role: "group", "aria-label": "Date range", children: PRESETS.map(([d, l]) => _jsx("button", { "aria-pressed": days === Number(d), onClick: () => setDays(Number(d)), className: cn('rounded-full border px-3 py-1.5 text-sm', days === Number(d) ? 'border-ink bg-ink text-white' : 'border-line bg-white text-neutral-600'), children: l }, d)) }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsx(Metric, { label: "Total submissions", value: String(rows.length), hint: days ? `of ${data.length} all time` : undefined }), _jsx(Metric, { label: "Completion rate", value: rate === null ? '–' : `${rate}%`, hint: rate === null ? 'Available after the public form has been opened' : `${data.length} responses from ${views} form views (all time)` }), _jsx(Metric, { label: "Avg. completion time", value: avgTime === null ? '–' : fmtDuration(avgTime), hint: avgTime === null ? 'No timing data in this period' : `Across ${times.length} responses` })] }), rows.length === 0 ? (_jsxs("div", { className: "rounded-xl border border-dashed border-line bg-white p-10 text-center", children: [_jsx("p", { className: "font-medium", children: "No responses in this period" }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: "Try a longer date range." })] })) : (_jsxs(_Fragment, { children: [_jsx(ChartCard, { title: "Response trend", subtitle: "Submissions over time", summary: `Line chart of submissions over time, ${rows.length} in total`, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: trend, margin: { left: -20, right: 12 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }), _jsx(XAxis, { dataKey: "label", tick: { fontSize: 12 }, minTickGap: 24 }), _jsx(YAxis, { allowDecimals: false, tick: { fontSize: 12 } }), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "count", name: "Submissions", stroke: form.accent, strokeWidth: 2, dot: trend.length < 20 })] }) }) }), _jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [ratings.map(({ f, data: d, avg, n }) => (_jsx(ChartCard, { title: f.label, subtitle: avg === null ? 'No ratings yet' : `Average ${avg.toFixed(1)} from ${n} ratings`, summary: `Bar chart of rating distribution for ${f.label}`, children: _jsx(Bars, { data: d, color: form.accent }) }, f.id))), choices.map(({ f, data: d }) => (_jsx(ChartCard, { title: f.label, subtitle: "Answer distribution", summary: `Bar chart of answers for ${f.label}`, children: _jsx(Bars, { data: d, color: form.accent, horizontal: true }) }, f.id)))] }), ratings.length + choices.length === 0 && _jsx("p", { className: "text-sm text-neutral-500", children: "Add rating, dropdown or multiple-choice fields to see answer distributions." })] }))] }))] }));
}
export default function Analytics() { return _jsx(WithForm, { children: f => _jsx(AnalyticsView, { form: f }) }); }
