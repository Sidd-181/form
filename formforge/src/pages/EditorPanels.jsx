import { useState } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2, Plus, X, Search } from 'lucide-react';
import { FIELD_TYPES, hasOptions, hasPlaceholder } from '../services/fieldTypes';
import FieldInput from '../components/FieldInput';
import { Button, Input, Toggle, cn } from '../components/ui';
export function Library({ onAdd }) {
    const [q, setQ] = useState('');
    const items = FIELD_TYPES.filter(f => f.label.toLowerCase().includes(q.toLowerCase()));
    return (<div className="space-y-5">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-neutral-400"/>
        <Input aria-label="Search fields" placeholder="Search element" className="pl-9" value={q} onChange={e => setQ(e.target.value)}/>
      </div>
      {['Text', 'Choice', 'Other'].map(g => {
            const group = items.filter(i => i.group === g);
            return group.length === 0 ? null : (<div key={g}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">{g}</p>
            <div className="grid grid-cols-2 gap-2">
              {group.map(f => (<button key={f.type} onClick={() => onAdd(f.type)} className="flex flex-col items-center gap-2 rounded-lg border border-line bg-white px-2 py-4 text-xs font-medium hover:border-accent-500 hover:bg-accent-50">
                  <f.icon size={18}/>{f.label}
                </button>))}
            </div>
          </div>);
        })}
      {items.length === 0 && <p className="text-sm text-neutral-500">No matching elements.</p>}
    </div>);
}
function SortableField({ field, selected, onSelect, onDuplicate, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
    return (<div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} onClick={onSelect} className={cn('group flex gap-2 rounded-xl border bg-white p-4', selected ? 'border-accent-500 ring-2 ring-accent-100' : 'border-line', isDragging && 'z-10 opacity-70')}>
      <button aria-label="Drag to reorder" {...attributes} {...listeners} className="mt-1 h-6 cursor-grab text-neutral-400 hover:text-ink"><GripVertical size={16}/></button>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{field.label || 'Untitled question'}{field.required && <span className="ml-0.5 text-red-500">*</span>}</p>
            {field.description && <p className="text-xs text-neutral-500">{field.description}</p>}
          </div>
          <div className={cn('flex gap-1', !selected && 'opacity-0 group-hover:opacity-100 focus-within:opacity-100')}>
            <button aria-label="Duplicate field" title="Duplicate" onClick={e => { e.stopPropagation(); onDuplicate(); }} className="grid h-7 w-7 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"><Copy size={14}/></button>
            <button aria-label="Delete field" title="Delete" onClick={e => { e.stopPropagation(); onDelete(); }} className="grid h-7 w-7 place-items-center rounded-md text-red-500 hover:bg-red-50"><Trash2 size={14}/></button>
          </div>
        </div>
        <div className="pointer-events-none"><FieldInput field={field} disabled/></div>
      </div>
    </div>);
}
export function Canvas({ form, selectedId, onSelect, onMeta, onDuplicate, onDelete, onAddClick }) {
    return (<div className="dot-grid min-h-full rounded-xl border border-line p-4 sm:p-8" onClick={() => onSelect(null)}>
      <div className="mx-auto max-w-xl space-y-3" onClick={e => e.stopPropagation()}>
        <div className="rounded-xl border border-line bg-white p-5" style={{ borderTop: `4px solid ${form.accent}` }}>
          <input aria-label="Form title" value={form.title} onChange={e => onMeta({ title: e.target.value })} placeholder="Form title" className="w-full text-xl font-semibold outline-none"/>
          <textarea aria-label="Form description" value={form.description} onChange={e => onMeta({ description: e.target.value })} placeholder="Add a description" rows={2} className="mt-1 w-full resize-none text-sm text-neutral-600 outline-none"/>
        </div>
        <SortableContext items={form.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
          {form.fields.map(f => (<SortableField key={f.id} field={f} selected={f.id === selectedId} onSelect={() => onSelect(f.id)} onDuplicate={() => onDuplicate(f.id)} onDelete={() => onDelete(f.id)}/>))}
        </SortableContext>
        <button onClick={onAddClick} className="flex h-16 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white/70 text-sm text-neutral-600 hover:border-accent-500 lg:pointer-events-none lg:opacity-60">
          <Plus size={16}/>{form.fields.length === 0 ? 'Add your first field from the library' : 'Add field from the library'}
        </button>
      </div>
    </div>);
}
export const SWATCHES = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#e11d48', '#0a0a0a'];
const Row = ({ label, children }) => <label className="block space-y-1.5"><span className="text-xs font-medium text-neutral-600">{label}</span>{children}</label>;
const num = (v) => (v === '' ? undefined : Number(v));
export function Properties({ form, field, onUpdate, onMeta }) {
    const [tab, setTab] = useState('field');
    const opts = field?.options ?? [];
    return (<div>
      <div className="mb-4 flex rounded-lg bg-neutral-100 p-0.5 text-sm" role="tablist">
        {['field', 'theme'].map(t => (<button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn('flex-1 rounded-md py-1.5 font-medium capitalize', tab === t ? 'bg-white shadow-sm' : 'text-neutral-500')}>{t === 'field' ? 'Field' : 'Theme'}</button>))}
      </div>
      {tab === 'theme' ? (<div className="space-y-3">
          <p className="text-xs font-medium text-neutral-600">Accent colour</p>
          <div className="flex flex-wrap gap-2">
            {SWATCHES.map(c => <button key={c} aria-label={`Accent ${c}`} aria-pressed={form.accent === c} onClick={() => onMeta({ accent: c })} style={{ background: c }} className={cn('h-8 w-8 rounded-full border-2', form.accent === c ? 'border-ink' : 'border-white ring-1 ring-line')}/>)}
          </div>
          <p className="text-xs text-neutral-500">Used for the header bar, buttons and ratings on the published form.</p>
        </div>) : !field ? (<p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-neutral-500">Select a field on the canvas to edit its properties.</p>) : (<div className="space-y-4">
          <Row label="Question label"><Input value={field.label} onChange={e => onUpdate({ label: e.target.value })}/></Row>
          <Row label="Description"><Input value={field.description ?? ''} onChange={e => onUpdate({ description: e.target.value })} placeholder="Help text"/></Row>
          {hasPlaceholder(field.type) && <Row label={field.type === 'checkbox' ? 'Checkbox text' : 'Placeholder'}><Input value={field.placeholder ?? ''} onChange={e => onUpdate({ placeholder: e.target.value })}/></Row>}
          <div className="flex items-center justify-between"><span className="text-sm font-medium">Required</span><Toggle label="Required" checked={field.required} onChange={v => onUpdate({ required: v })}/></div>
          {hasOptions(field.type) && (<div className="space-y-2">
              <p className="text-xs font-medium text-neutral-600">Options</p>
              {opts.map((o, i) => (<div key={i} className="flex gap-2">
                  <Input aria-label={`Option ${i + 1}`} value={o} onChange={e => onUpdate({ options: opts.map((x, j) => (j === i ? e.target.value : x)) })}/>
                  <button aria-label={`Remove option ${i + 1}`} disabled={opts.length <= 1} onClick={() => onUpdate({ options: opts.filter((_, j) => j !== i) })} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"><X size={16}/></button>
                </div>))}
              <Button size="sm" variant="secondary" onClick={() => onUpdate({ options: [...opts, `Option ${opts.length + 1}`] })}><Plus size={14}/>Add option</Button>
            </div>)}
          {['short_text', 'long_text', 'number', 'rating', 'file'].includes(field.type) && (<div className="space-y-3 border-t border-line pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Validation</p>
              {field.type === 'rating' ? (<Row label="Number of stars (3–10)"><Input type="number" min={3} max={10} value={field.max ?? 5} onChange={e => onUpdate({ max: Math.min(10, Math.max(3, Number(e.target.value) || 5)) })}/></Row>) : field.type === 'file' ? (<Row label="Max file size (MB)"><Input type="number" min={1} value={field.max ?? ''} onChange={e => onUpdate({ max: num(e.target.value) })} placeholder="No limit"/></Row>) : (<div className="grid grid-cols-2 gap-3">
                  <Row label={field.type === 'number' ? 'Min value' : 'Min length'}><Input type="number" value={field.min ?? ''} onChange={e => onUpdate({ min: num(e.target.value) })}/></Row>
                  <Row label={field.type === 'number' ? 'Max value' : 'Max length'}><Input type="number" value={field.max ?? ''} onChange={e => onUpdate({ max: num(e.target.value) })}/></Row>
                </div>)}
            </div>)}
        </div>)}
    </div>);
}
