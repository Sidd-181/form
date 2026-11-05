import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Eye, Inbox, Mail, MessageCircle, Share2, Send } from 'lucide-react';
import WithForm from '../components/WithForm.js';
import { Badge, Button, Dialog, Input } from '../components/ui.js';
import { setStatus, updateSettings, useAppDispatch } from '../store/index.js';
const Card = ({ title, children }) => (_jsxs("section", { className: "space-y-3 rounded-xl border border-line bg-white p-5", children: [_jsx("h2", { className: "font-medium", children: title }), children] }));
function CopyBox({ label, value, multiline }) {
    const [state, setState] = useState('idle');
    const copy = () => {
        if (!navigator.clipboard) {
            setState('failed');
            return;
        }
        navigator.clipboard.writeText(value).then(() => { setState('copied'); setTimeout(() => setState('idle'), 1800); }).catch(() => setState('failed'));
    };
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-start gap-2", children: [multiline
                        ? _jsx("textarea", { readOnly: true, "aria-label": label, value: value, rows: 3, onFocus: e => e.target.select(), className: "w-full resize-none rounded-lg border border-line bg-neutral-50 p-3 font-mono text-xs" })
                        : _jsx(Input, { readOnly: true, "aria-label": label, value: value, onFocus: e => e.target.select(), className: "bg-neutral-50" }), _jsx(Button, { variant: "secondary", onClick: copy, className: "shrink-0", children: state === 'copied' ? _jsxs(_Fragment, { children: [_jsx(Check, { size: 16 }), "Copied"] }) : _jsxs(_Fragment, { children: [_jsx(Copy, { size: 16 }), "Copy"] }) })] }), state === 'failed' && _jsx("p", { role: "alert", className: "text-xs text-red-600", children: "Couldn't copy automatically. Select the text and copy it manually." })] }));
}
const toLocalInput = (iso) => {
    if (!iso)
        return '';
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
function Limits({ form }) {
    const dispatch = useAppDispatch();
    const [limit, setLimit] = useState(form.submissionLimit ? String(form.submissionLimit) : '');
    const [expires, setExpires] = useState(toLocalInput(form.expiresAt));
    const [msg, setMsg] = useState(null);
    const save = async () => {
        const n = limit.trim() === '' ? null : Number(limit);
        if (n !== null && (!Number.isInteger(n) || n < 1)) {
            setMsg({ ok: false, text: 'Submission limit must be a whole number of 1 or more.' });
            return;
        }
        try {
            await dispatch(updateSettings({ id: form.id, submissionLimit: n, expiresAt: expires ? new Date(expires).toISOString() : null })).unwrap();
            setMsg({ ok: true, text: 'Settings saved.' });
        }
        catch (e) {
            setMsg({ ok: false, text: e.message ?? 'Could not save settings.' });
        }
    };
    return (_jsxs(Card, { title: "Submission limit and expiration", children: [_jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("label", { className: "block space-y-1.5", children: [_jsx("span", { className: "text-xs font-medium text-neutral-600", children: "Maximum responses (blank = unlimited)" }), _jsx(Input, { type: "number", min: 1, value: limit, onChange: e => setLimit(e.target.value), placeholder: "Unlimited" })] }), _jsxs("label", { className: "block space-y-1.5", children: [_jsx("span", { className: "text-xs font-medium text-neutral-600", children: "Close form on (blank = never)" }), _jsx(Input, { type: "datetime-local", value: expires, onChange: e => setExpires(e.target.value) })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Button, { onClick: save, children: "Save settings" }), msg && _jsx("p", { role: msg.ok ? 'status' : 'alert', className: msg.ok ? 'text-sm text-emerald-700' : 'text-sm text-red-600', children: msg.text })] }), _jsxs("p", { className: "text-xs text-neutral-500", children: [form.responseCount ?? 0, " responses so far. The form closes automatically when either condition is met."] })] }));
}
function ShareView({ form }) {
    const dispatch = useAppDispatch();
    const [confirm, setConfirm] = useState(false);
    const [error, setError] = useState(null);
    const published = form.status === 'published';
    const url = `${window.location.origin}/forms/${form.id}`;
    const embed = `<iframe src="${url}" width="100%" height="720" style="border:0" title="${form.title.replace(/"/g, '&quot;')}"></iframe>`;
    const enc = encodeURIComponent;
    const links = [
        { label: 'Email', icon: Mail, href: `mailto:?subject=${enc(form.title)}&body=${enc(url)}` },
        { label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/?text=${enc(`${form.title} ${url}`)}` },
        { label: 'X', icon: Send, href: `https://twitter.com/intent/tweet?text=${enc(form.title)}&url=${enc(url)}` },
        { label: 'LinkedIn', icon: Share2, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    ];
    const toggle = async () => {
        setError(null);
        try {
            await dispatch(setStatus({ id: form.id, status: published ? 'draft' : 'published' })).unwrap();
            setConfirm(false);
        }
        catch (e) {
            setError(e.message ?? 'Something went wrong');
        }
    };
    return (_jsxs("div", { className: "mx-auto max-w-3xl space-y-5", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Publish & share" }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: form.title })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Link, { to: `/app/forms/${form.id}/preview`, children: _jsxs(Button, { variant: "secondary", size: "sm", children: [_jsx(Eye, { size: 14 }), "Preview"] }) }), _jsx(Link, { to: `/app/forms/${form.id}/responses`, children: _jsxs(Button, { variant: "secondary", size: "sm", children: [_jsx(Inbox, { size: 14 }), "Responses"] }) })] })] }), _jsx(Card, { title: "Status", children: _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Badge, { tone: published ? 'green' : 'neutral', children: published ? 'Published' : 'Draft' }), _jsx("p", { className: "text-sm text-neutral-600", children: published ? 'Anyone with the link can respond.' : 'Publish to make the link work and start collecting responses.' })] }), _jsx(Button, { variant: published ? 'secondary' : 'primary', onClick: () => { setError(null); setConfirm(true); }, children: published ? 'Unpublish' : 'Publish' })] }) }), _jsxs(Card, { title: "Public link", children: [_jsx(CopyBox, { label: "Public form URL", value: url }), !published && _jsx("p", { className: "text-xs text-amber-700", children: "This link shows a \"closed\" message until the form is published." }), window.location.hostname === 'localhost' && _jsx("p", { className: "text-xs text-neutral-500", children: "This is a localhost link, so only you can open it. Deploy the app to share it publicly." }), _jsx("div", { className: "flex flex-wrap gap-2 pt-1", children: links.map(l => _jsxs("a", { href: l.href, target: "_blank", rel: "noopener noreferrer", className: "inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-neutral-50", children: [_jsx(l.icon, { size: 14 }), l.label] }, l.label)) })] }), _jsx(Card, { title: "Embed on your website", children: _jsx(CopyBox, { label: "Embed code", value: embed, multiline: true }) }), _jsx(Limits, { form: form }, form.id), _jsxs(Dialog, { open: confirm, onClose: () => setConfirm(false), title: published ? 'Unpublish form?' : 'Publish form?', children: [_jsx("p", { children: published ? 'The public link will stop accepting responses. Existing responses are kept.' : 'The form becomes publicly accessible and starts accepting responses.' }), error && _jsx("p", { role: "alert", className: "mt-3 text-red-600", children: error }), _jsxs("div", { className: "mt-6 flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setConfirm(false), children: "Cancel" }), _jsx(Button, { onClick: toggle, children: published ? 'Unpublish' : 'Publish' })] })] })] }));
}
export default function Share() { return _jsx(WithForm, { children: f => _jsx(ShareView, { form: f }) }); }
