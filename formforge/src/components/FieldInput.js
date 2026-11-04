import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Star, Upload } from 'lucide-react';
import { cn } from './ui.js';
const base = 'w-full rounded-lg border bg-white px-3 text-sm placeholder:text-neutral-400 focus:outline-2 focus:outline-accent-100';
const maxFileSize = 10 * 1024 * 1024;
const MB = 1024 * 1024;
const acceptedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
// Renders one field. Without onChange it is a static preview (editor canvas); with onChange it is a controlled input.
export default function FieldInput({ field, disabled = false, value, onChange, id, invalid, accent = '#4f46e5', describedBy, onFileUpload, maxUploadSizeBytes = maxFileSize }) {
    const [uploading, setUploading] = React.useState(false);
    const [uploadError, setUploadError] = React.useState(null);
    const generatedId = React.useId();
    const controlId = id ?? `field-${generatedId}`;
    const { type, placeholder, options = [] } = field;
    const fileSizeLimit = Math.min(maxUploadSizeBytes, field.max == null ? Infinity : Math.floor(field.max * MB));
    const cls = cn(base, invalid ? 'border-red-400' : 'border-line');
    const ctl = onChange ? { value: String(value ?? ''), onChange: (e) => onChange(e.target.value) } : {};
    const aria = { 'aria-invalid': invalid || undefined, 'aria-required': field.required || undefined, 'aria-describedby': describedBy };
    switch (type) {
        case 'long_text': return _jsx("textarea", { id: id, disabled: disabled, placeholder: placeholder, rows: 4, className: cn(cls, 'py-2'), ...aria, ...ctl });
        case 'dropdown': return (_jsxs("select", { id: id, disabled: disabled, className: cn(cls, 'h-10'), ...aria, ...(onChange ? ctl : { defaultValue: '' }), children: [_jsx("option", { value: "", disabled: true, children: placeholder || 'Select an option' }), options.map(o => _jsx("option", { children: o }, o))] }));
        case 'multiple_choice': return (_jsx("div", { id: options.length === 0 ? controlId : undefined, tabIndex: options.length === 0 ? -1 : undefined, role: "radiogroup", "aria-labelledby": id ? `${id}-label` : undefined, "aria-required": field.required || undefined, className: "space-y-2", children: options.map((o, i) => {
                const optionId = `${controlId}-option-${i}`;
                const radioId = i === 0 ? controlId : optionId;
                return _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { id: radioId, type: "radio", name: `group-${controlId}`, disabled: disabled, checked: onChange ? value === o : undefined, onChange: () => onChange?.(o), style: { accentColor: accent }, ...aria }), _jsx("label", { htmlFor: radioId, children: o })] }, `${o}-${i}`);
            }) }));
        case 'checkbox': return _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { id: controlId, type: "checkbox", disabled: disabled, checked: onChange ? value === true : undefined, onChange: e => onChange?.(e.target.checked), style: { accentColor: accent }, ...aria }), _jsx("label", { htmlFor: controlId, children: placeholder || 'Yes' })] });
        case 'rating': return (_jsx("div", { role: "group", "aria-labelledby": id ? `${id}-label` : undefined, className: "flex gap-1", children: Array.from({ length: field.max ?? 5 }, (_, i) => {
                const on = Number(value ?? 0) > i;
                return _jsx("button", { type: "button", id: i === 0 ? controlId : undefined, disabled: disabled, "aria-label": `${i + 1} star${i ? 's' : ''}`, "aria-pressed": on, onClick: () => onChange?.(i + 1), className: "rounded p-0.5 text-neutral-300 focus-visible:outline-2", style: on ? { color: accent } : undefined, children: _jsx(Star, { size: 26, fill: on ? 'currentColor' : 'none' }) }, i);
            }) }));
        case 'file': {
            const file = value && typeof value === 'object' && 'fileId' in value ? value : null;
            return onChange && onFileUpload ? _jsxs("div", { className: "space-y-2", children: [_jsx("input", { id: controlId, type: "file", accept: ".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf", disabled: disabled || uploading, onChange: async (e) => {
                            const selected = e.target.files?.[0];
                            if (!selected)
                                return;
                            setUploadError(null);
                            if (selected.size === 0) {
                                setUploadError('File cannot be empty.');
                                e.target.value = '';
                                return;
                            }
                            if (!acceptedTypes.includes(selected.type)) {
                                setUploadError('Upload a PNG, JPEG, or PDF file.');
                                e.target.value = '';
                                return;
                            }
                            if (selected.size > fileSizeLimit) {
                                setUploadError(`File must be ${Number((fileSizeLimit / MB).toFixed(2))} MB or smaller.`);
                                e.target.value = '';
                                return;
                            }
                            setUploading(true);
                            try {
                                onChange(await onFileUpload(selected));
                            }
                            catch (error) {
                                setUploadError(error instanceof Error ? error.message : 'File upload failed. Please try again.');
                            }
                            finally {
                                setUploading(false);
                                e.target.value = '';
                            }
                        }, className: "block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm", ...aria }), uploading && _jsx("p", { role: "status", className: "text-xs text-neutral-500", children: "Uploading file\u2026" }), file && _jsxs("p", { role: "status", className: "text-xs text-neutral-600", children: ["Uploaded: ", file.name] }), uploadError && _jsx("p", { role: "alert", className: "text-xs text-red-600", children: uploadError })] }) : _jsxs("div", { className: "flex h-20 items-center justify-center gap-2 rounded-lg border border-dashed border-line text-sm text-neutral-500", children: [_jsx(Upload, { size: 16 }), "Click to upload"] });
        }
        default: return _jsx("input", { id: id, disabled: disabled, type: { email: 'email', number: 'number', phone: 'tel', date: 'date' }[type] ?? 'text', placeholder: placeholder, className: cn(cls, 'h-10'), ...aria, ...ctl });
    }
}
