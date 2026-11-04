import { useEffect, useReducer, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ArrowLeft, Undo2, Redo2, Eye, Check, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector, updateContent, setStatus, fetchForm } from '../store';
import { newField } from '../services/fieldTypes';
import { uid } from '../services/uid';
import { Button, Dialog, cn } from '../components/ui';
import { Library, Canvas, Properties } from './EditorPanels';
function reducer(h, a) {
    if (a.t === 'set')
        return { past: [...h.past.slice(-49), h.present], present: a.f, future: [] };
    if (a.t === 'undo')
        return h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h;
    return h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h;
}
export default function Editor() {
    const { id = '' } = useParams();
    const dispatch = useAppDispatch();
    const form = useAppSelector(s => s.forms.find(f => f.id === id));
    const [missing, setMissing] = useState(false);
    useEffect(() => { if (!form)
        dispatch(fetchForm(id)).unwrap().catch(() => setMissing(true)); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
    if (form)
        return <EditorInner key={form.id} initial={form}/>;
    if (!missing)
        return <div className="grid min-h-screen place-items-center text-neutral-500"><Loader2 className="animate-spin"/></div>;
    return <div className="grid min-h-screen place-items-center text-center"><div><p className="font-medium">Form not found</p><Link to="/app" className="text-sm text-accent-600">Back to dashboard</Link></div></div>;
}
function EditorInner({ initial }) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const status = useAppSelector(s => s.forms.find(f => f.id === initial.id)?.status ?? 'draft');
    const workspace = useAppSelector(s => s.auth.user?.workspaceName) || 'My workspace';
    const [h, hd] = useReducer(reducer, { past: [], present: initial, future: [] });
    const form = h.present;
    const [selectedId, setSelectedId] = useState(null);
    const [panel, setPanel] = useState('canvas');
    const [confirm, setConfirm] = useState(false);
    const [saved, setSaved] = useState(true);
    const lastSaved = useRef(initial);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const [saveError, setSaveError] = useState(null);
    const [publishError, setPublishError] = useState(null);
    const save = (f) => dispatch(updateContent({ id: f.id, title: f.title, description: f.description, fields: f.fields, accent: f.accent })).unwrap().then(r => { lastSaved.current = f; return r; });
    const flush = () => save(form).then(() => { setSaved(true); setSaveError(null); }).catch((e) => setSaveError(e.message ?? 'Save failed'));
    // Debounced autosave whenever the working copy changes.
    useEffect(() => {
        if (form === lastSaved.current)
            return;
        setSaved(false);
        const t = setTimeout(() => { void flush(); }, 600);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form]);
    const edit = (fn) => hd({ t: 'set', f: fn(form) });
    const patchField = (fid, p) => edit(f => ({ ...f, fields: f.fields.map(x => (x.id === fid ? { ...x, ...p } : x)) }));
    const add = (type) => { const nf = newField(type); edit(f => ({ ...f, fields: [...f.fields, nf] })); setSelectedId(nf.id); };
    const remove = (fid) => { edit(f => ({ ...f, fields: f.fields.filter(x => x.id !== fid) })); if (selectedId === fid)
        setSelectedId(null); };
    const duplicate = (fid) => edit(f => {
        const i = f.fields.findIndex(x => x.id === fid);
        const copy = { ...f.fields[i], id: uid(), label: `${f.fields[i].label} (copy)` };
        return { ...f, fields: [...f.fields.slice(0, i + 1), copy, ...f.fields.slice(i + 1)] };
    });
    const onDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id)
            return;
        edit(f => ({ ...f, fields: arrayMove(f.fields, f.fields.findIndex(x => x.id === active.id), f.fields.findIndex(x => x.id === over.id)) }));
    };
    const publish = async () => {
        setPublishError(null);
        try {
            await save(form);
            await dispatch(setStatus({ id: form.id, status: 'published' })).unwrap();
            navigate(`/app/forms/${form.id}/share`);
        }
        catch (e) {
            setPublishError(e.message ?? 'Could not publish');
        }
    };
    const selected = form.fields.find(f => f.id === selectedId);
    const iconBtn = 'grid h-9 w-9 place-items-center rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-40';
    return (<div className="flex h-screen flex-col bg-canvas">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line bg-white px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/app" aria-label="Back to dashboard" className={iconBtn}><ArrowLeft size={18}/></Link>
          <p className="hidden truncate text-sm text-neutral-500 sm:block">{workspace} / <span className="font-medium text-ink">{form.title || 'Untitled form'}</span></p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="mr-1 hidden items-center gap-1 text-xs text-neutral-500 md:flex" aria-live="polite">{saveError ? <button onClick={() => void flush()} className="text-red-600 underline">Save failed, retry</button> : saved ? <><Check size={14}/>All changes saved</> : <><Loader2 size={14} className="animate-spin"/>Saving…</>}</span>
          <button aria-label="Undo" title="Undo" disabled={!h.past.length} onClick={() => hd({ t: 'undo' })} className={iconBtn}><Undo2 size={16}/></button>
          <button aria-label="Redo" title="Redo" disabled={!h.future.length} onClick={() => hd({ t: 'redo' })} className={iconBtn}><Redo2 size={16}/></button>
          <Link to={`/app/forms/${form.id}/preview`} onClick={() => void flush()}><Button variant="secondary" size="sm"><Eye size={14}/>Preview</Button></Link>
          {status === 'published' ? <Link to={`/app/forms/${form.id}/share`}><Button size="sm">Share</Button></Link> : <Button size="sm" onClick={() => setConfirm(true)}>Publish</Button>}
        </div>
      </header>

      <div className="flex shrink-0 border-b border-line bg-white p-1 lg:hidden" role="tablist">
        {[['library', 'Add'], ['canvas', 'Form'], ['props', 'Properties']].map(([k, l]) => (<button key={k} role="tab" aria-selected={panel === k} onClick={() => setPanel(k)} className={cn('flex-1 rounded-md py-2 text-sm font-medium', panel === k ? 'bg-neutral-100' : 'text-neutral-500')}>{l}</button>))}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[260px_1fr_300px]">
        <aside className={cn('overflow-y-auto border-r border-line bg-white p-4 lg:block', panel !== 'library' && 'hidden')}><Library onAdd={t => { add(t); setPanel('canvas'); }}/></aside>
        <main className={cn('min-w-0 overflow-y-auto p-3 sm:p-5 lg:block', panel !== 'canvas' && 'hidden')}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <Canvas form={form} selectedId={selectedId} onSelect={id => { setSelectedId(id); if (id)
        setPanel('props'); }} onMeta={p => edit(f => ({ ...f, ...p }))} onDuplicate={duplicate} onDelete={remove} onAddClick={() => setPanel('library')}/>
          </DndContext>
        </main>
        <aside className={cn('overflow-y-auto border-l border-line bg-white p-4 lg:block', panel !== 'props' && 'hidden')}>
          <Properties form={form} field={selected} onUpdate={p => selected && patchField(selected.id, p)} onMeta={p => edit(f => ({ ...f, ...p }))}/>
        </aside>
      </div>

      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Publish form?">
        <p>"{form.title || 'Untitled form'}" will get a public link and start accepting responses. You can unpublish at any time.</p>
        {publishError && <p role="alert" className="mt-3 text-red-600">{publishError}</p>}<div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button><Button onClick={publish}>Publish</Button></div>
      </Dialog>
    </div>);
}
