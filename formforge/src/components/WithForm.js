import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { fetchForm, useAppDispatch, useAppSelector } from '../store/index.js';
// Resolves the :id route param to a form (from the store, or fetched), with loading and not-found states.
export default function WithForm({ children }) {
    const { id = '' } = useParams();
    const dispatch = useAppDispatch();
    const form = useAppSelector(s => s.forms.find(f => f.id === id));
    const [missing, setMissing] = useState(false);
    useEffect(() => { if (!form)
        dispatch(fetchForm(id)).unwrap().catch(() => setMissing(true)); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
    if (form)
        return _jsx(_Fragment, { children: children(form) });
    if (!missing)
        return _jsx("div", { className: "grid min-h-[40vh] place-items-center text-neutral-500", children: _jsx(Loader2, { className: "animate-spin" }) });
    return _jsxs("div", { className: "py-20 text-center", children: [_jsx("p", { className: "font-medium", children: "Form not found" }), _jsx(Link, { to: "/app", className: "text-sm text-accent-600", children: "Back to dashboard" })] });
}
