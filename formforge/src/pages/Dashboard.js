import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, Pencil, Eye, Inbox, Copy, Trash2, FileText, Globe, MessageSquare } from 'lucide-react';
import { useAppDispatch, useAppSelector, duplicateForm, removeForm, setStatus, loadDashboard } from '../store/index.js';
import { Button, Input, Badge, Dialog, cn } from '../components/ui.js';
const timeAgo = (iso) => {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 60)
        return `${Math.max(m, 1)}m ago`;
    if (m < 1440)
        return `${Math.floor(m / 60)}h ago`;
    return `${Math.floor(m / 1440)}d ago`;
};
function Metric({ label, value, icon: Icon }) {
    return (_jsxs("div", { className: "rounded-xl border border-line bg-white p-5", children: [_jsxs("div", { className: "flex items-center justify-between text-sm text-neutral-500", children: [label, _jsx(Icon, { size: 16 })] }), _jsx("p", { className: "mt-2 text-3xl font-semibold tracking-tight", children: value })] }));
}
export default function Dashboard() {
    const forms = useAppSelector(s => s.forms);
    const responses = useAppSelector(s => s.responses);
    const load = useAppSelector(s => s.load);
    const loadError = useAppSelector(s => s.loadError);
    const user = useAppSelector(s => s.auth.user);
    const dispatch = useAppDispatch();
    useEffect(() => { dispatch(loadDashboard()); }, [dispatch]);
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [status, setFilter] = useState('all');
    const [view, setView] = useState('grid');
    const [pending, setPending] = useState(null);
    const visible = useMemo(() => forms.filter(f => (status === 'all' || f.status === status) && f.title.toLowerCase().includes(query.trim().toLowerCase())), [forms, query, status]);
    const activity = useMemo(() => {
        const title = (id) => forms.find(f => f.id === id)?.title ?? 'a form';
        return [
            ...forms.map(f => ({ at: f.updatedAt, text: `${f.title} was ${f.status === 'published' ? 'published' : 'updated'}` })),
            ...responses.map(r => ({ at: r.submittedAt, text: `New response on ${title(r.formId)}` })),
        ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
    }, [forms, responses]);
    const confirm = async () => {
        if (!pending)
            return;
        const { kind, form } = pending;
        try {
            if (kind === 'delete')
                await dispatch(removeForm(form.id)).unwrap();
            else
                await dispatch(setStatus({ id: form.id, status: kind === 'publish' ? 'published' : 'draft' })).unwrap();
            setPending(null);
        }
        catch (e) {
            setPending(p => p && { ...p, error: e.message ?? 'Something went wrong' });
        }
    };
    const actions = (f) => (_jsxs("div", { className: "flex items-center gap-1", children: [[
                { label: 'Edit', icon: Pencil, run: () => navigate(`/app/forms/${f.id}/edit`) },
                { label: 'Preview', icon: Eye, run: () => navigate(`/app/forms/${f.id}/preview`) },
                { label: 'View responses', icon: Inbox, run: () => navigate(`/app/forms/${f.id}/responses`) },
                { label: 'Duplicate', icon: Copy, run: () => dispatch(duplicateForm(f.id)) },
                { label: 'Delete', icon: Trash2, run: () => setPending({ kind: 'delete', form: f }) },
            ].map(a => (_jsx("button", { title: a.label, "aria-label": a.label, onClick: a.run, className: "grid h-8 w-8 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-ink", children: _jsx(a.icon, { size: 16 }) }, a.label))), _jsx(Button, { size: "sm", variant: "secondary", className: "ml-1", onClick: () => setPending({ kind: f.status === 'published' ? 'unpublish' : 'publish', form: f }), children: f.status === 'published' ? 'Unpublish' : 'Publish' })] }));
    const statusBadge = (f) => _jsx(Badge, { tone: f.status === 'published' ? 'green' : 'neutral', children: f.status === 'published' ? 'Published' : 'Draft' });
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-semibold tracking-tight", children: ["Welcome back, ", user?.name.split(' ')[0]] }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: "Build, publish and analyze your forms in one place." })] }), _jsx(Link, { to: "/app/forms/new", children: _jsxs(Button, { children: [_jsx(Plus, { size: 16 }), "Create new form"] }) })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsx(Metric, { label: "Total forms", value: forms.length, icon: FileText }), _jsx(Metric, { label: "Total responses", value: forms.reduce((n, f) => n + (f.responseCount ?? 0), 0), icon: MessageSquare }), _jsx(Metric, { label: "Published forms", value: forms.filter(f => f.status === 'published').length, icon: Globe })] }), _jsxs("div", { className: "grid gap-8 lg:grid-cols-[1fr_300px]", children: [_jsxs("section", { className: "min-w-0 space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "relative min-w-[200px] flex-1", children: [_jsx(Search, { size: 16, className: "absolute left-3 top-3 text-neutral-400" }), _jsx(Input, { "aria-label": "Search forms", placeholder: "Search forms", className: "pl-9", value: query, onChange: e => setQuery(e.target.value) })] }), _jsx("div", { className: "flex rounded-lg border border-line bg-white p-0.5", role: "group", "aria-label": "Filter by status", children: ['all', 'draft', 'published'].map(s => (_jsx("button", { onClick: () => setFilter(s), className: cn('rounded-md px-3 py-1.5 text-sm capitalize', status === s ? 'bg-ink text-white' : 'text-neutral-600'), children: s }, s))) }), _jsx("div", { className: "flex rounded-lg border border-line bg-white p-0.5", role: "group", "aria-label": "View mode", children: [['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (_jsx("button", { "aria-label": `${v} view`, "aria-pressed": view === v, onClick: () => setView(v), className: cn('grid h-8 w-8 place-items-center rounded-md', view === v ? 'bg-ink text-white' : 'text-neutral-600'), children: _jsx(Icon, { size: 16 }) }, v))) })] }), load === 'error' ? (_jsxs("div", { className: "rounded-xl border border-line bg-white p-10 text-center", role: "alert", children: [_jsx("p", { className: "font-medium", children: "Couldn't load your forms" }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: loadError }), _jsx(Button, { className: "mt-4", onClick: () => dispatch(loadDashboard()), children: "Try again" })] })) : load !== 'ready' && forms.length === 0 ? (_jsx("p", { className: "rounded-xl border border-line bg-white p-10 text-center text-sm text-neutral-500", children: "Loading your forms\u2026" })) : visible.length === 0 ? (_jsxs("div", { className: "rounded-xl border border-dashed border-line bg-white p-10 text-center", children: [_jsx("p", { className: "font-medium", children: forms.length === 0 ? 'No forms yet' : 'No forms match your search' }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: forms.length === 0 ? 'Create your first form from a template or from scratch.' : 'Try a different search term or status filter.' }), forms.length === 0 && _jsx(Link, { to: "/app/forms/new", children: _jsx(Button, { className: "mt-4", children: "Create new form" }) })] })) : view === 'grid' ? (_jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: visible.map(f => (_jsxs("article", { className: "flex flex-col rounded-xl border border-line bg-white p-5", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx(Link, { to: `/app/forms/${f.id}/edit`, className: "font-medium hover:text-accent-600", children: f.title }), statusBadge(f)] }), _jsx("p", { className: "mt-1 line-clamp-2 text-sm text-neutral-500", children: f.description || 'No description' }), _jsxs("p", { className: "mt-4 text-xs text-neutral-500", children: [f.fields.length, " fields \u00B7 ", (f.responseCount ?? 0), " responses \u00B7 Updated ", timeAgo(f.updatedAt)] }), _jsx("div", { className: "mt-4 border-t border-line pt-3", children: actions(f) })] }, f.id))) })) : (_jsx("div", { className: "divide-y divide-line overflow-x-auto rounded-xl border border-line bg-white", children: visible.map(f => (_jsxs("div", { className: "flex min-w-[640px] items-center justify-between gap-4 p-4", children: [_jsxs("div", { className: "min-w-0", children: [_jsx(Link, { to: `/app/forms/${f.id}/edit`, className: "font-medium hover:text-accent-600", children: f.title }), _jsxs("p", { className: "text-xs text-neutral-500", children: [(f.responseCount ?? 0), " responses \u00B7 Updated ", timeAgo(f.updatedAt)] })] }), statusBadge(f), actions(f)] }, f.id))) }))] }), _jsxs("aside", { className: "h-fit rounded-xl border border-line bg-white p-5", children: [_jsx("h2", { className: "font-medium", children: "Recent activity" }), activity.length === 0 ? _jsx("p", { className: "mt-3 text-sm text-neutral-500", children: "Nothing yet." }) : (_jsx("ul", { className: "mt-4 space-y-4", children: activity.map((a, i) => (_jsxs("li", { className: "text-sm", children: [_jsx("p", { children: a.text }), _jsx("p", { className: "text-xs text-neutral-500", children: timeAgo(a.at) })] }, i))) }))] })] }), _jsxs(Dialog, { open: !!pending, onClose: () => setPending(null), title: pending?.kind === 'delete' ? 'Delete form?' : pending?.kind === 'publish' ? 'Publish form?' : 'Unpublish form?', children: [_jsxs("p", { children: [pending?.kind === 'delete' && `"${pending.form.title}" and all of its responses will be permanently deleted.`, pending?.kind === 'publish' && `"${pending.form.title}" will become publicly accessible and start accepting responses.`, pending?.kind === 'unpublish' && `"${pending.form.title}" will stop accepting responses. Existing responses are kept.`] }), pending?.error && _jsx("p", { role: "alert", className: "mt-3 text-red-600", children: pending.error }), _jsxs("div", { className: "mt-6 flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setPending(null), children: "Cancel" }), _jsx(Button, { variant: pending?.kind === 'delete' ? 'danger' : 'primary', onClick: confirm, children: pending?.kind === 'delete' ? 'Delete' : pending?.kind === 'publish' ? 'Publish' : 'Unpublish' })] })] })] }));
}
