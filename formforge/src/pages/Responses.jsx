import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Search, Trash2 } from 'lucide-react';
import WithForm from '../components/WithForm';
import FormTabs from '../components/FormTabs';
import { Button, Dialog, Input } from '../components/ui';
import { answerForResponseField, downloadCsv, fieldsForResponse, fmtAnswer, inRange, responseFieldColumns, responseFieldKey, toCsv, useResponses } from '../services/responses';
import { api } from '../services/api';
const PAGE = 25;
const when = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
function FileDownload({ formId, file }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const download = async () => {
        setLoading(true);
        setError(null);
        try {
            const blob = await api.downloadFile(formId, file.fileId);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        catch (e) {
            setError(e.message || 'Could not download file.');
        }
        finally {
            setLoading(false);
        }
    };
    return <span className="inline-flex flex-col items-start gap-1">
      <Button size="sm" variant="secondary" onClick={download} disabled={loading}>{loading ? 'Downloading…' : `Download ${file.name}`}</Button>
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </span>;
}
function ResponsesView({ form }) {
    const { data, error, reload, remove } = useResponses(form.id);
    const [q, setQ] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [shown, setShown] = useState(PAGE);
    const [open, setOpen] = useState(null);
    const [del, setDel] = useState(null);
    const rows = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return (data ?? []).filter(r => inRange(r.submittedAt, from, to) && (!needle || Object.values(r.answers).some(a => fmtAnswer(a).toLowerCase().includes(needle))));
    }, [data, q, from, to]);
    const allColumns = responseFieldColumns(rows, form.fields);
    const cols = allColumns.slice(0, 4);
    const exportCsv = () => {
        const head = ['Submitted at', ...allColumns.map(f => f.label), 'Completion time (s)'];
        const body = rows.map(r => [new Date(r.submittedAt).toISOString(), ...allColumns.map(f => answerForResponseField(r, f, form.fields)), r.completionSeconds != null ? String(r.completionSeconds) : '']);
        downloadCsv(`${(form.title || 'form').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-responses.csv`, toCsv([head, ...body]));
    };
    const confirmDelete = async () => {
        if (!del)
            return;
        try {
            await remove(del.r.id);
            if (open?.id === del.r.id)
                setOpen(null);
            setDel(null);
        }
        catch (e) {
            setDel({ ...del, error: e.message });
        }
    };
    return (<div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">{form.title}</h1><p className="mt-1 text-sm text-neutral-500">Responses</p></div>
        <Button variant="secondary" onClick={exportCsv} disabled={rows.length === 0}><Download size={16}/>Export CSV</Button>
      </div>
      <FormTabs id={form.id}/>

      {error ? (<div role="alert" className="rounded-xl border border-line bg-white p-10 text-center"><p className="font-medium">Couldn't load responses</p><p className="mt-1 text-sm text-neutral-500">{error}</p><Button className="mt-4" onClick={reload}>Try again</Button></div>) : !data ? (<p className="rounded-xl border border-line bg-white p-10 text-center text-sm text-neutral-500">Loading responses…</p>) : (<>
          <div className="flex flex-wrap items-end gap-3">
            <div className="rounded-xl border border-line bg-white px-4 py-2"><p className="text-xs text-neutral-500">Total responses</p><p className="text-2xl font-semibold">{data.length}</p></div>
            <div className="relative min-w-[200px] flex-1">
              <Search size={16} className="absolute left-3 top-3 text-neutral-400"/>
              <Input aria-label="Search responses" placeholder="Search answers" className="pl-9" value={q} onChange={e => { setQ(e.target.value); setShown(PAGE); }}/>
            </div>
            <label className="text-xs text-neutral-600">From<Input type="date" value={from} max={to || undefined} onChange={e => { setFrom(e.target.value); setShown(PAGE); }} className="mt-1 w-40"/></label>
            <label className="text-xs text-neutral-600">To<Input type="date" value={to} min={from || undefined} onChange={e => { setTo(e.target.value); setShown(PAGE); }} className="mt-1 w-40"/></label>
            {(q || from || to) && <Button variant="ghost" onClick={() => { setQ(''); setFrom(''); setTo(''); setShown(PAGE); }}>Clear filters</Button>}
          </div>

          {data.length === 0 ? (<div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
              <p className="font-medium">No responses yet</p>
              <p className="mt-1 text-sm text-neutral-500">{form.status === 'published' ? 'Share your link to start collecting responses.' : 'Publish this form to start collecting responses.'}</p>
              <Link to={`/app/forms/${form.id}/share`}><Button className="mt-4">{form.status === 'published' ? 'Get the link' : 'Publish & share'}</Button></Link>
            </div>) : rows.length === 0 ? (<div className="rounded-xl border border-dashed border-line bg-white p-10 text-center"><p className="font-medium">No responses match your filters</p></div>) : (<div className="overflow-x-auto rounded-xl border border-line bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-line bg-neutral-50 text-xs text-neutral-500">
                  <tr><th className="px-4 py-3 font-medium">Submitted</th>{cols.map(c => <th key={responseFieldKey(c)} className="px-4 py-3 font-medium">{c.label}</th>)}<th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.slice(0, shown).map(r => (<tr key={r.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{when(r.submittedAt)}</td>
                      {cols.map(c => <td key={responseFieldKey(c)} className="max-w-[220px] truncate px-4 py-3">{answerForResponseField(r, c, form.fields) || <span className="text-neutral-400">–</span>}</td>)}
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        <button aria-label="View response" title="View" onClick={() => setOpen(r)} className="mr-1 inline-grid h-8 w-8 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"><Eye size={16}/></button>
                        <button aria-label="Delete response" title="Delete" onClick={() => setDel({ r })} className="inline-grid h-8 w-8 place-items-center rounded-md text-red-500 hover:bg-red-50"><Trash2 size={16}/></button>
                      </td>
                    </tr>))}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-neutral-500">
                <span>Showing {Math.min(shown, rows.length)} of {rows.length}{rows.length !== data.length && ` (filtered from ${data.length})`}</span>
                {rows.length > shown && <Button size="sm" variant="secondary" onClick={() => setShown(s => s + PAGE)}>Show more</Button>}
              </div>
            </div>)}
        </>)}

      <Dialog open={!!open} onClose={() => setOpen(null)} title="Response details" wide>
        {open && (<>
            <p className="text-xs text-neutral-500">Submitted {when(open.submittedAt)}{open.completionSeconds != null && ` · completed in ${open.completionSeconds}s`}</p>
            <dl className="mt-4 space-y-4">
              {fieldsForResponse(open, form.fields).map(f => (<div key={responseFieldKey(f)}><dt className="text-xs font-medium text-neutral-500">{f.label}</dt><dd className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink">
                {open.answers[f.id] && typeof open.answers[f.id] === 'object' && 'fileId' in open.answers[f.id]
                    ? <FileDownload formId={form.id} file={open.answers[f.id]}/>
                    : fmtAnswer(open.answers[f.id]) || <span className="text-neutral-400">No answer</span>}
              </dd></div>))}
            </dl>
            <div className="mt-6 flex justify-between">
              <Button variant="danger" size="sm" onClick={() => setDel({ r: open })}><Trash2 size={14}/>Delete</Button>
              <Button variant="secondary" onClick={() => setOpen(null)}>Close</Button>
            </div>
          </>)}
      </Dialog>
      <Dialog open={!!del} onClose={() => setDel(null)} title="Delete response?">
        <p>This response will be permanently deleted. This can't be undone.</p>
        {del?.error && <p role="alert" className="mt-3 text-red-600">{del.error}</p>}
        <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></div>
      </Dialog>
    </div>);
}
export default function Responses() { return <WithForm>{f => <ResponsesView form={f}/>}</WithForm>; }
