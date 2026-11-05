import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { api, ApiError } from '../services/api.js';
import FormRenderer from '../components/FormRenderer.js';
// Public, unauthenticated page for respondents. Never renders the dashboard or editor.
export default function PublicForm() {
    const { formId = '' } = useParams();
    const [view, setView] = useState({ k: 'loading' });
    useEffect(() => {
        let live = true;
        api.getPublicForm(formId).then(form => live && setView({ k: 'ready', form })).catch((e) => {
            if (!live)
                return;
            const body = e.body;
            setView(e.status === 403 || e.status === 410 ? { k: 'closed', title: body?.title, message: e.message }
                : e.status === 404 ? { k: 'closed', message: 'This form does not exist.' } : { k: 'error', message: e.message });
        });
        return () => { live = false; };
    }, [formId]);
    const submit = async (answers, seconds) => {
        try {
            await api.submitResponse(formId, answers, seconds);
        }
        catch (e) {
            if (e instanceof ApiError) {
                if (e.status === 422)
                    return e.body.errors;
                if (e.status === 403 || e.status === 410) {
                    setView({ k: 'closed', title: (view.k === 'ready' ? view.form.title : undefined), message: e.message });
                    return;
                }
            }
            throw e;
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-canvas px-4 py-10", children: _jsxs("div", { className: "mx-auto max-w-xl", children: [view.k === 'loading' && _jsx("div", { className: "grid min-h-[40vh] place-items-center text-neutral-500", children: _jsx(Loader2, { className: "animate-spin", "aria-label": "Loading form" }) }), view.k === 'ready' && _jsx(FormRenderer, { form: view.form, onSubmit: submit, onFileUpload: (fieldId, file) => api.uploadFile(formId, fieldId, file) }), view.k === 'closed' && (_jsxs("div", { className: "rounded-2xl border border-line bg-white p-8 text-center", role: "status", children: [_jsx(Lock, { className: "mx-auto text-neutral-400" }), view.title && _jsx("h1", { className: "mt-3 text-xl font-semibold", children: view.title }), _jsx("p", { className: "mt-2 text-sm text-neutral-600", children: view.message })] })), view.k === 'error' && _jsx("div", { role: "alert", className: "rounded-2xl border border-line bg-white p-8 text-center text-sm text-neutral-600", children: view.message }), _jsxs("p", { className: "mt-6 text-center text-xs text-neutral-400", children: ["Powered by ", _jsx(Link, { to: "/", className: "font-medium", children: "FormForge" })] })] }) }));
}
