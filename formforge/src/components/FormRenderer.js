import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import FieldInput from './FieldInput.js';
import { firstInvalidField, validateAll } from '../services/validation.js';
// The respondent-facing form. Shared by the preview page and the public page so they always match.
export default function FormRenderer({ form, onSubmit, onFileUpload, notice }) {
    const formId = useId().replace(/:/g, '');
    const [values, setValues] = useState({});
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [banner, setBanner] = useState(null);
    const [started, setStarted] = useState(() => Date.now());
    const [uploadCount, setUploadCount] = useState(0);
    const change = (id, v) => {
        setValues(s => ({ ...s, [id]: v }));
        if (errors[id])
            setErrors(({ [id]: _drop, ...rest }) => rest);
    };
    const focusFirstInvalid = (fieldErrors) => {
        const first = firstInvalidField(form.fields, fieldErrors);
        if (first)
            document.getElementById(`field-${formId}-${form.fields.indexOf(first)}`)?.focus();
    };
    const upload = (fieldId, file) => {
        if (!onFileUpload)
            return Promise.reject(new Error('File upload is unavailable.'));
        setUploadCount(count => count + 1);
        return onFileUpload(fieldId, file).finally(() => setUploadCount(count => count - 1));
    };
    const submit = async (e) => {
        e.preventDefault();
        const errs = validateAll(form.fields, values);
        setErrors(errs);
        if (Object.keys(errs).length) {
            focusFirstInvalid(errs);
            return;
        }
        setSubmitting(true);
        setBanner(null);
        try {
            const serverErrs = await onSubmit(values, Math.round((Date.now() - started) / 1000));
            if (serverErrs && Object.keys(serverErrs).length) {
                setErrors(serverErrs);
                focusFirstInvalid(serverErrs);
            }
            else
                setDone(true);
        }
        catch (err) {
            setBanner(err.message || 'Could not submit. Please try again.');
        }
        finally {
            setSubmitting(false);
        }
    };
    const reset = () => { setValues({}); setErrors({}); setDone(false); setStarted(Date.now()); };
    return (_jsx("div", { className: "rounded-2xl border border-line bg-white", style: { borderTop: `4px solid ${form.accent}` }, children: done ? (_jsxs("div", { className: "space-y-3 p-8 text-center", role: "status", children: [_jsx(CheckCircle2, { size: 40, className: "mx-auto", style: { color: form.accent } }), _jsx("h2", { className: "text-xl font-semibold", children: "Thank you!" }), _jsx("p", { className: "text-sm text-neutral-600", children: notice ? 'This was a preview, so nothing was saved.' : 'Your response has been recorded.' }), _jsx("button", { onClick: reset, className: "text-sm font-medium underline", children: "Submit another response" })] })) : (_jsxs("form", { noValidate: true, onSubmit: submit, className: "space-y-6 p-6", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: form.title || 'Untitled form' }), form.description && _jsx("p", { className: "mt-1 text-sm text-neutral-600", children: form.description })] }), notice && _jsx("p", { className: "rounded-lg bg-amber-50 p-3 text-xs text-amber-800", children: notice }), form.fields.length === 0 && _jsx("p", { className: "text-sm text-neutral-500", children: "This form has no fields yet." }), form.fields.map((f, index) => {
                    const id = `field-${formId}-${index}`;
                    const group = f.type === 'multiple_choice' || f.type === 'rating' || f.type === 'checkbox';
                    const label = _jsxs(_Fragment, { children: [f.label || 'Untitled question', f.required && _jsx("span", { className: "ml-0.5 text-red-500", "aria-hidden": true, children: "*" })] });
                    return (_jsx("div", { className: "space-y-1.5", children: f.type === 'multiple_choice' || f.type === 'checkbox' ? _jsxs("fieldset", { "aria-describedby": errors[f.id] ? `${id}-error` : undefined, "aria-invalid": !!errors[f.id] || undefined, className: "space-y-1.5", children: [_jsx("legend", { id: `${id}-label`, className: "text-sm font-medium", children: label }), f.description && _jsx("p", { className: "text-xs text-neutral-500", children: f.description }), _jsx(FieldInput, { field: f, id: id, value: values[f.id], onChange: v => change(f.id, v), invalid: !!errors[f.id], describedBy: errors[f.id] ? `${id}-error` : undefined, accent: form.accent }), errors[f.id] && _jsx("p", { id: `${id}-error`, role: "alert", className: "text-xs text-red-600", children: errors[f.id] })] }) : _jsxs(_Fragment, { children: [group ? _jsx("p", { id: `${id}-label`, className: "text-sm font-medium", children: label }) : _jsx("label", { htmlFor: id, className: "block text-sm font-medium", children: label }), f.description && _jsx("p", { className: "text-xs text-neutral-500", children: f.description }), _jsx(FieldInput, { field: f, id: id, value: values[f.id], onChange: v => change(f.id, v), maxUploadSizeBytes: form.maxUploadSizeBytes, onFileUpload: f.type === 'file' && onFileUpload ? file => upload(f.id, file) : undefined, invalid: !!errors[f.id], describedBy: errors[f.id] ? `${id}-error` : undefined, accent: form.accent }), errors[f.id] && _jsx("p", { id: `${id}-error`, role: "alert", className: "text-xs text-red-600", children: errors[f.id] })] }) }, f.id));
                }), banner && _jsx("p", { role: "alert", className: "rounded-lg bg-red-50 p-3 text-sm text-red-700", children: banner }), _jsx("button", { type: "submit", disabled: submitting || uploadCount > 0 || form.fields.length === 0, className: "h-11 w-full rounded-lg text-sm font-medium text-white disabled:opacity-50", style: { background: form.accent }, children: uploadCount > 0 ? 'Uploading…' : submitting ? 'Submitting…' : 'Submit' })] })) }));
}
