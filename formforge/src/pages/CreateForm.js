import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector, createForm } from '../store/index.js';
import { CATEGORIES, TEMPLATES, buildForm } from '../services/templates.js';
import { Button, cn } from '../components/ui.js';
export default function CreateForm() {
    const [cat, setCat] = useState('All');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const defaultAccent = useAppSelector(s => s.auth.user?.defaultAccent);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const create = async (t) => {
        setBusy(true);
        setError(null);
        const { title, description, fields, accent } = buildForm(t);
        try {
            const f = await dispatch(createForm({ title, description, fields, accent: defaultAccent ?? accent })).unwrap();
            navigate(`/app/forms/${f.id}/edit`);
        }
        catch (e) {
            setError(e.message ?? 'Could not create the form');
            setBusy(false);
        }
    };
    const list = TEMPLATES.filter(t => cat === 'All' || t.category === cat);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Create a form" }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: "Start from scratch or pick a template and customize it." })] }), error && _jsx("p", { role: "alert", className: "rounded-lg bg-red-50 p-3 text-sm text-red-700", children: error }), _jsx("div", { className: "flex flex-wrap gap-2", role: "group", "aria-label": "Template categories", children: ['All', ...CATEGORIES].map(c => (_jsx("button", { onClick: () => setCat(c), "aria-pressed": cat === c, className: cn('rounded-full border px-3 py-1.5 text-sm', cat === c ? 'border-ink bg-ink text-white' : 'border-line bg-white text-neutral-600 hover:bg-neutral-50'), children: c }, c))) }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: [_jsxs("button", { disabled: busy, onClick: () => create(), className: "flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white p-5 text-center hover:border-accent-500", children: [_jsx("span", { className: "grid h-10 w-10 place-items-center rounded-full bg-accent-50 text-accent-600", children: _jsx(Plus, { size: 20 }) }), _jsx("span", { className: "font-medium", children: "Start from scratch" }), _jsx("span", { className: "text-sm text-neutral-500", children: "A blank form with one field" })] }), list.map(t => (_jsxs("article", { className: "flex flex-col rounded-xl border border-line bg-white p-5", children: [_jsx("span", { className: "w-fit rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700", children: t.category }), _jsx("h2", { className: "mt-3 font-medium", children: t.title }), _jsx("p", { className: "mt-1 flex-1 text-sm text-neutral-500", children: t.description }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [_jsxs("span", { className: "text-xs text-neutral-500", children: [t.fields.length, " fields"] }), _jsx(Button, { size: "sm", disabled: busy, onClick: () => create(t), children: "Use template" })] })] }, t.id)))] })] }));
}
