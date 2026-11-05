import { useId, useState } from 'react';
import { Star, Upload } from 'lucide-react';
import { cn } from './ui';
const base = 'w-full rounded-lg border bg-white px-3 text-sm placeholder:text-neutral-400 focus:outline-2 focus:outline-accent-100';
const defaultMaxFileSize = 10 * 1024 * 1024;
const MB = 1024 * 1024;
const acceptedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
// Renders one field. Without onChange it is a static preview (editor canvas); with onChange it is a controlled input.
export default function FieldInput({ field, disabled = false, value, onChange, id, invalid, accent = '#4f46e5', describedBy, onFileUpload, maxUploadSizeBytes = defaultMaxFileSize }) {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const generatedId = useId();
    const controlId = id ?? `field-${generatedId}`;
    const { type, placeholder, options = [] } = field;
    const fileSizeLimit = Math.min(maxUploadSizeBytes, field.max == null ? Infinity : Math.floor(field.max * MB));
    const cls = cn(base, invalid ? 'border-red-400' : 'border-line');
    const ctl = onChange ? { value: String(value ?? ''), onChange: (e) => onChange(e.target.value) } : {};
    const aria = { 'aria-invalid': invalid || undefined, 'aria-required': field.required || undefined, 'aria-describedby': describedBy };
    switch (type) {
        case 'long_text': return <textarea id={id} disabled={disabled} placeholder={placeholder} rows={4} className={cn(cls, 'py-2')} {...aria} {...ctl}/>;
        case 'dropdown': return (<select id={id} disabled={disabled} className={cn(cls, 'h-10')} {...aria} {...(onChange ? ctl : { defaultValue: '' })}>
        <option value="" disabled>{placeholder || 'Select an option'}</option>{options.map(o => <option key={o}>{o}</option>)}
      </select>);
        case 'multiple_choice': return (<div id={options.length === 0 ? controlId : undefined} tabIndex={options.length === 0 ? -1 : undefined} role="radiogroup" aria-labelledby={id ? `${id}-label` : undefined} aria-required={field.required || undefined} className="space-y-2">
        {options.map((o, i) => {
                const radioId = i === 0 ? controlId : `${controlId}-option-${i}`;
                return <div key={`${o}-${i}`} className="flex items-center gap-2 text-sm"><input id={radioId} type="radio" name={`group-${controlId}`} disabled={disabled} checked={onChange ? value === o : undefined} onChange={() => onChange?.(o)} style={{ accentColor: accent }} {...aria}/><label htmlFor={radioId}>{o}</label></div>;
            })}
      </div>);
        case 'checkbox': return <div className="flex items-center gap-2 text-sm"><input id={controlId} type="checkbox" disabled={disabled} checked={onChange ? value === true : undefined} onChange={e => onChange?.(e.target.checked)} style={{ accentColor: accent }} {...aria}/><label htmlFor={controlId}>{placeholder || 'Yes'}</label></div>;
        case 'rating': return (<div role="group" aria-labelledby={id ? `${id}-label` : undefined} className="flex gap-1">
        {Array.from({ length: field.max ?? 5 }, (_, i) => {
                const on = Number(value ?? 0) > i;
                return <button key={i} type="button" id={i === 0 ? controlId : undefined} disabled={disabled} aria-label={`${i + 1} star${i ? 's' : ''}`} aria-pressed={on} onClick={() => onChange?.(i + 1)} className="rounded p-0.5 text-neutral-300 focus-visible:outline-2" style={on ? { color: accent } : undefined}><Star size={26} fill={on ? 'currentColor' : 'none'}/></button>;
            })}
      </div>);
        case 'file': {
            const file = value && typeof value === 'object' && 'fileId' in value ? value : null;
            return onChange && onFileUpload ? <div className="space-y-2">
        <input id={controlId} type="file" accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf" disabled={disabled || uploading} onChange={async e => {
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
                }} className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm" {...aria}/>
        {uploading && <p role="status" className="text-xs text-neutral-500">Uploading file…</p>}
        {file && <p role="status" className="text-xs text-neutral-600">Uploaded: {file.name}</p>}
        {uploadError && <p role="alert" className="text-xs text-red-600">{uploadError}</p>}
      </div> : <div className="flex h-20 items-center justify-center gap-2 rounded-lg border border-dashed border-line text-sm text-neutral-500"><Upload size={16}/>Click to upload</div>;
        }
        default: return <input id={id} disabled={disabled} type={{ email: 'email', number: 'number', phone: 'tel', date: 'date' }[type] ?? 'text'} placeholder={placeholder} className={cn(cls, 'h-10')} {...aria} {...ctl}/>;
    }
}
