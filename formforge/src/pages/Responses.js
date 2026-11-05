import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Search, Trash2 } from 'lucide-react';
import WithForm from '../components/WithForm.js';
import FormTabs from '../components/FormTabs.js';
import { Button, Dialog, Input } from '../components/ui.js';
import { downloadCsv, fmtAnswer, inRange, toCsv, useResponses } from '../services/responses.js';
import { api } from '../services/api.js';
const PAGE = 25;
const when = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
function FileDownload({ formId, file }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const download = async () => {
        setLoading(true);
        setError(null);
        try {
            const blob = await api.downloadFile(formId, file.fileId);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        catch (e) {
            setError(e.message || 'Could not download file.');
        }
        finally {
            setLoading(false);
        }
    };
    return _jsxs("span", { className: "inline-flex flex-col items-start gap-1", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: download, disabled: loading, children: loading ? 'Downloading…' : `Download ${file.name}` }), error && _jsx("span", { role: "alert", className: "text-xs text-red-600", children: error })] });
}
function ResponsesView({ form }) {
    const { data, error, reload, remove } = useResponses(form.id);
    const [q, setQ] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [shown, setShown] = useState(PAGE);
    const [open, setOpen] = useState(null);
    const [del, setDel] = useState(null);
    const rows = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return (data ?? []).filter(r => inRange(r.submittedAt, from, to) && (!needle || Object.values(r.answers).some(a => fmtAnswer(a).toLowerCase().includes(needle))));
    }, [data, q, from, to]);
    const cols = form.fields.slice(0, 4);
    const exportCsv = () => {
        const head = ['Submitted at', ...form.fields.map(f => f.label), 'Completion time (s)'];
        const body = rows.map(r => [new Date(r.submittedAt).toISOString(), ...form.fields.map(f => fmtAnswer(r.answers[f.id])), r.completionSeconds != null ? String(r.completionSeconds) : '']);
        downloadCsv(`${(form.title || 'form').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-responses.csv`, toCsv([head, ...body]));
    };
    const confirmDelete = async () => {
        if (!del)
            return;
        try {
            await remove(del.r.id);
            if (open?.id === del.r.id)
                setOpen(null);
            setDel(null);
        }
        catch (e) {
            setDel({ ...del, error: e.message });
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: form.title }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: "Responses" })] }), _jsxs(Button, { variant: "secondary", onClick: exportCsv, disabled: rows.length === 0, children: [_jsx(Download, { size: 16 }), "Export CSV"] })] }), _jsx(FormTabs, { id: form.id }), error ? (_jsxs("div", { role: "alert", className: "rounded-xl border border-line bg-white p-10 text-center", children: [_jsx("p", { className: "font-medium", children: "Couldn't load responses" }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: error }), _jsx(Button, { className: "mt-4", onClick: reload, children: "Try again" })] })) : !data ? (_jsx("p", { className: "rounded-xl border border-line bg-white p-10 text-center text-sm text-neutral-500", children: "Loading responses\u2026" })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-wrap items-end gap-3", children: [_jsxs("div", { className: "rounded-xl border border-line bg-white px-4 py-2", children: [_jsx("p", { className: "text-xs text-neutral-500", children: "Total responses" }), _jsx("p", { className: "text-2xl font-semibold", children: data.length })] }), _jsxs("div", { className: "relative min-w-[200px] flex-1", children: [_jsx(Search, { size: 16, className: "absolute left-3 top-3 text-neutral-400" }), _jsx(Input, { "aria-label": "Search responses", placeholder: "Search answers", className: "pl-9", value: q, onChange: e => { setQ(e.target.value); setShown(PAGE); } })] }), _jsxs("label", { className: "text-xs text-neutral-600", children: ["From", _jsx(Input, { type: "date", value: from, max: to || undefined, onChange: e => { setFrom(e.target.value); setShown(PAGE); }, className: "mt-1 w-40" })] }), _jsxs("label", { className: "text-xs text-neutral-600", children: ["To", _jsx(Input, { type: "date", value: to, min: from || undefined, onChange: e => { setTo(e.target.value); setShown(PAGE); }, className: "mt-1 w-40" })] }), (q || from || to) && _jsx(Button, { variant: "ghost", onClick: () => { setQ(''); setFrom(''); setTo(''); setShown(PAGE); }, children: "Clear filters" })] }), data.length === 0 ? (_jsxs("div", { className: "rounded-xl border border-dashed border-line bg-white p-10 text-center", children: [_jsx("p", { className: "font-medium", children: "No responses yet" }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: form.status === 'published' ? 'Share your link to start collecting responses.' : 'Publish this form to start collecting responses.' }), _jsx(Link, { to: `/app/forms/${form.id}/share`, children: _jsx(Button, { className: "mt-4", children: form.status === 'published' ? 'Get the link' : 'Publish & share' }) })] })) : rows.length === 0 ? (_jsx("div", { className: "rounded-xl border border-dashed border-line bg-white p-10 text-center", children: _jsx("p", { className: "font-medium", children: "No responses match your filters" }) })) : (_jsxs("div", { className: "overflow-x-auto rounded-xl border border-line bg-white", children: [_jsxs("table", { className: "w-full min-w-[640px] text-left text-sm", children: [_jsx("thead", { className: "border-b border-line bg-neutral-50 text-xs text-neutral-500", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Submitted" }), cols.map(c => _jsx("th", { className: "px-4 py-3 font-medium", children: c.label }, c.id)), _jsx("th", { className: "px-4 py-3", children: _jsx("span", { className: "sr-only", children: "Actions" }) })] }) }), _jsx("tbody", { className: "divide-y divide-line", children: rows.slice(0, shown).map(r => (_jsxs("tr", { children: [_jsx("td", { className: "whitespace-nowrap px-4 py-3 text-neutral-600", children: when(r.submittedAt) }), cols.map(c => _jsx("td", { className: "max-w-[220px] truncate px-4 py-3", children: fmtAnswer(r.answers[c.id]) || _jsx("span", { className: "text-neutral-400", children: "\u2013" }) }, c.id)), _jsxs("td", { className: "whitespace-nowrap px-4 py-2 text-right", children: [_jsx("button", { "aria-label": "View response", title: "View", onClick: () => setOpen(r), className: "mr-1 inline-grid h-8 w-8 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100", children: _jsx(Eye, { size: 16 }) }), _jsx("button", { "aria-label": "Delete response", title: "Delete", onClick: () => setDel({ r }), className: "inline-grid h-8 w-8 place-items-center rounded-md text-red-500 hover:bg-red-50", children: _jsx(Trash2, { size: 16 }) })] })] }, r.id))) })] }), _jsxs("div", { className: "flex items-center justify-between border-t border-line px-4 py-3 text-xs text-neutral-500", children: [_jsxs("span", { children: ["Showing ", Math.min(shown, rows.length), " of ", rows.length, rows.length !== data.length && ` (filtered from ${data.length})`] }), rows.length > shown && _jsx(Button, { size: "sm", variant: "secondary", onClick: () => setShown(s => s + PAGE), children: "Show more" })] })] }))] })), _jsx(Dialog, { open: !!open, onClose: () => setOpen(null), title: "Response details", wide: true, children: open && (_jsxs(_Fragment, { children: [_jsxs("p", { className: "text-xs text-neutral-500", children: ["Submitted ", when(open.submittedAt), open.completionSeconds != null && ` · completed in ${open.completionSeconds}s`] }), _jsx("dl", { className: "mt-4 space-y-4", children: form.fields.map(f => {
                                const answer = open.answers[f.id];
                                const uploadedFile = answer && typeof answer === 'object' && 'fileId' in answer ? answer : null;
                                return _jsxs("div", { children: [_jsx("dt", { className: "text-xs font-medium text-neutral-500", children: f.label }), _jsx("dd", { className: "mt-0.5 whitespace-pre-wrap break-words text-sm text-ink", children: uploadedFile ? _jsx(FileDownload, { formId: form.id, file: uploadedFile }) : fmtAnswer(answer) || _jsx("span", { className: "text-neutral-400", children: "No answer" }) })] }, f.id);
                            }) }), _jsxs("div", { className: "mt-6 flex justify-between", children: [_jsxs(Button, { variant: "danger", size: "sm", onClick: () => setDel({ r: open }), children: [_jsx(Trash2, { size: 14 }), "Delete"] }), _jsx(Button, { variant: "secondary", onClick: () => setOpen(null), children: "Close" })] })] })) }), _jsxs(Dialog, { open: !!del, onClose: () => setDel(null), title: "Delete response?", children: [_jsx("p", { children: "This response will be permanently deleted. This can't be undone." }), del?.error && _jsx("p", { role: "alert", className: "mt-3 text-red-600", children: del.error }), _jsxs("div", { className: "mt-6 flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setDel(null), children: "Cancel" }), _jsx(Button, { variant: "danger", onClick: confirmDelete, children: "Delete" })] })] })] }));
}
export default function Responses() { return _jsx(WithForm, { children: f => _jsx(ResponsesView, { form: f }) }); }
