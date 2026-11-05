import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ArrowLeft, Undo2, Redo2, Eye, Check, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector, updateContent, setStatus, fetchForm } from '../store/index.js';
import { newField } from '../services/fieldTypes.js';
import { createLatestSaveQueue } from '../services/saveQueue.js';
import { validateFormContent } from '../services/validation.js';
import { uid } from '../services/uid.js';
import { Button, Dialog, cn } from '../components/ui.js';
import { Library, Canvas, Properties } from './EditorPanels.js';
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
        return _jsx(EditorInner, { initial: form }, form.id);
    if (!missing)
        return _jsx("div", { className: "grid min-h-screen place-items-center text-neutral-500", children: _jsx(Loader2, { className: "animate-spin" }) });
    return _jsx("div", { className: "grid min-h-screen place-items-center text-center", children: _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Form not found" }), _jsx(Link, { to: "/app", className: "text-sm text-accent-600", children: "Back to dashboard" })] }) });
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
    const latestForm = useRef(initial);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const [saveError, setSaveError] = useState(null);
    const [publishError, setPublishError] = useState(null);
    const saveQueue = useRef(null);
    if (!saveQueue.current)
        saveQueue.current = createLatestSaveQueue(async (f) => {
            const invalid = validateFormContent(f);
            if (invalid)
                throw new Error(invalid);
            await dispatch(updateContent({ id: f.id, title: f.title, description: f.description, fields: f.fields, accent: f.accent })).unwrap();
            lastSaved.current = f;
        });
    const queue = saveQueue.current;
    useLayoutEffect(() => {
        if (form !== latestForm.current) {
            latestForm.current = form;
            queue.setLatest(form);
        }
    }, [form, queue]);
    const flush = (snapshot = form) => {
        if (snapshot !== latestForm.current) {
            latestForm.current = snapshot;
            queue.setLatest(snapshot);
        }
        setSaved(false);
        return queue.flush().then(() => {
            if (queue.isSaved()) {
                setSaved(true);
                setSaveError(null);
            }
        }).catch((e) => {
            setSaveError(e.message ?? 'Save failed');
            throw e;
        });
    };
    // Debounced autosave whenever the working copy changes.
    useEffect(() => {
        if (form === lastSaved.current)
            return;
        setSaved(false);
        const t = setTimeout(() => { void flush(form).catch(() => { }); }, 600);
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
            await flush(form);
            await dispatch(setStatus({ id: form.id, status: 'published' })).unwrap();
            navigate(`/app/forms/${form.id}/share`);
        }
        catch (e) {
            setPublishError(e.message ?? 'Could not publish');
        }
    };
    const selected = form.fields.find(f => f.id === selectedId);
    const iconBtn = 'grid h-9 w-9 place-items-center rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-40';
    return (_jsxs("div", { className: "flex h-screen flex-col bg-canvas", children: [_jsxs("header", { className: "flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line bg-white px-3 sm:px-5", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsx(Link, { to: "/app", "aria-label": "Back to dashboard", className: iconBtn, children: _jsx(ArrowLeft, { size: 18 }) }), _jsxs("p", { className: "hidden truncate text-sm text-neutral-500 sm:block", children: [workspace, " / ", _jsx("span", { className: "font-medium text-ink", children: form.title || 'Untitled form' })] })] }), _jsxs("div", { className: "flex items-center gap-1 sm:gap-2", children: [_jsx("span", { className: "mr-1 hidden items-center gap-1 text-xs text-neutral-500 md:flex", "aria-live": "polite", children: saveError ? _jsx("button", { onClick: () => void flush(), className: "text-red-600 underline", children: "Save failed, retry" }) : saved ? _jsxs(_Fragment, { children: [_jsx(Check, { size: 14 }), "All changes saved"] }) : _jsxs(_Fragment, { children: [_jsx(Loader2, { size: 14, className: "animate-spin" }), "Saving\u2026"] }) }), _jsx("button", { "aria-label": "Undo", title: "Undo", disabled: !h.past.length, onClick: () => hd({ t: 'undo' }), className: iconBtn, children: _jsx(Undo2, { size: 16 }) }), _jsx("button", { "aria-label": "Redo", title: "Redo", disabled: !h.future.length, onClick: () => hd({ t: 'redo' }), className: iconBtn, children: _jsx(Redo2, { size: 16 }) }), _jsx(Link, { to: `/app/forms/${form.id}/preview`, onClick: () => void flush(), children: _jsxs(Button, { variant: "secondary", size: "sm", children: [_jsx(Eye, { size: 14 }), "Preview"] }) }), status === 'published' ? _jsx(Link, { to: `/app/forms/${form.id}/share`, children: _jsx(Button, { size: "sm", children: "Share" }) }) : _jsx(Button, { size: "sm", onClick: () => setConfirm(true), children: "Publish" })] })] }), _jsx("div", { className: "flex shrink-0 border-b border-line bg-white p-1 lg:hidden", role: "tablist", children: [['library', 'Add'], ['canvas', 'Form'], ['props', 'Properties']].map(([k, l]) => (_jsx("button", { role: "tab", "aria-selected": panel === k, onClick: () => setPanel(k), className: cn('flex-1 rounded-md py-2 text-sm font-medium', panel === k ? 'bg-neutral-100' : 'text-neutral-500'), children: l }, k))) }), _jsxs("div", { className: "grid min-h-0 flex-1 lg:grid-cols-[260px_1fr_300px]", children: [_jsx("aside", { className: cn('overflow-y-auto border-r border-line bg-white p-4 lg:block', panel !== 'library' && 'hidden'), children: _jsx(Library, { onAdd: t => { add(t); setPanel('canvas'); } }) }), _jsx("main", { className: cn('min-w-0 overflow-y-auto p-3 sm:p-5 lg:block', panel !== 'canvas' && 'hidden'), children: _jsx(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragEnd: onDragEnd, children: _jsx(Canvas, { form: form, selectedId: selectedId, onSelect: id => { setSelectedId(id); if (id)
                                    setPanel('props'); }, onMeta: p => edit(f => ({ ...f, ...p })), onDuplicate: duplicate, onDelete: remove, onAddClick: () => setPanel('library') }) }) }), _jsx("aside", { className: cn('overflow-y-auto border-l border-line bg-white p-4 lg:block', panel !== 'props' && 'hidden'), children: _jsx(Properties, { form: form, field: selected, onUpdate: p => selected && patchField(selected.id, p), onMeta: p => edit(f => ({ ...f, ...p })) }) })] }), _jsxs(Dialog, { open: confirm, onClose: () => setConfirm(false), title: "Publish form?", children: [_jsxs("p", { children: ["\"", form.title || 'Untitled form', "\" will get a public link and start accepting responses. You can unpublish at any time."] }), publishError && _jsx("p", { role: "alert", className: "mt-3 text-red-600", children: publishError }), _jsxs("div", { className: "mt-6 flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setConfirm(false), children: "Cancel" }), _jsx(Button, { onClick: publish, children: "Publish" })] })] })] }));
}
