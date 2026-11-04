import { Star, Upload } from 'lucide-react';
import { cn } from './ui';
const base = 'w-full rounded-lg border bg-white px-3 text-sm placeholder:text-neutral-400 focus:outline-2 focus:outline-accent-100';
// Renders one field. Without onChange it is a static preview (editor canvas); with onChange it is a controlled input.
export default function FieldInput({ field, disabled = false, value, onChange, id, invalid, accent = '#4f46e5' }) {
    const { type, placeholder, options = [] } = field;
    const cls = cn(base, invalid ? 'border-red-400' : 'border-line');
    const ctl = onChange ? { value: String(value ?? ''), onChange: (e) => onChange(e.target.value) } : {};
    const aria = { 'aria-invalid': invalid || undefined, 'aria-required': field.required || undefined };
    switch (type) {
        case 'long_text': return <textarea id={id} disabled={disabled} placeholder={placeholder} rows={4} className={cn(cls, 'py-2')} {...aria} {...ctl}/>;
        case 'dropdown': return (<select id={id} disabled={disabled} className={cn(cls, 'h-10')} {...aria} {...(onChange ? ctl : { defaultValue: '' })}>
        <option value="" disabled>{placeholder || 'Select an option'}</option>{options.map(o => <option key={o}>{o}</option>)}
      </select>);
        case 'multiple_choice': return (<div role="radiogroup" aria-labelledby={id ? `${id}-label` : undefined} className="space-y-2">
        {options.map(o => <label key={o} className="flex items-center gap-2 text-sm"><input type="radio" name={field.id} disabled={disabled} checked={onChange ? value === o : undefined} onChange={() => onChange?.(o)} style={{ accentColor: accent }}/>{o}</label>)}
      </div>);
        case 'checkbox': return <label className="flex items-center gap-2 text-sm"><input id={id} type="checkbox" disabled={disabled} checked={onChange ? value === true : undefined} onChange={e => onChange?.(e.target.checked)} style={{ accentColor: accent }} {...aria}/>{placeholder || 'Yes'}</label>;
        case 'rating': return (<div role="group" aria-labelledby={id ? `${id}-label` : undefined} className="flex gap-1">
        {Array.from({ length: field.max ?? 5 }, (_, i) => {
                const on = Number(value ?? 0) > i;
                return <button key={i} type="button" id={i === 0 ? id : undefined} disabled={disabled} aria-label={`${i + 1} star${i ? 's' : ''}`} aria-pressed={on} onClick={() => onChange?.(i + 1)} className="rounded p-0.5 text-neutral-300 focus-visible:outline-2" style={on ? { color: accent } : undefined}><Star size={26} fill={on ? 'currentColor' : 'none'}/></button>;
            })}
      </div>);
        case 'file': return onChange ? (<input id={id} type="file" onChange={e => onChange(e.target.files?.[0]?.name ?? '')} className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm" {...aria}/>) : <div className="flex h-20 items-center justify-center gap-2 rounded-lg border border-dashed border-line text-sm text-neutral-500"><Upload size={16}/>Click to upload</div>;
        default: return <input id={id} disabled={disabled} type={{ email: 'email', number: 'number', phone: 'tel', date: 'date' }[type] ?? 'text'} placeholder={placeholder} className={cn(cls, 'h-10')} {...aria} {...ctl}/>;
    }
}
