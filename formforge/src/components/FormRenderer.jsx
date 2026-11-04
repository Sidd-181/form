import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import FieldInput from './FieldInput';
import { validateAll } from '../services/validation';
// The respondent-facing form. Shared by the preview page and the public page so they always match.
export default function FormRenderer({ form, onSubmit, notice }) {
    const [values, setValues] = useState({});
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [banner, setBanner] = useState(null);
    const [started, setStarted] = useState(() => Date.now());
    const change = (id, v) => {
        setValues(s => ({ ...s, [id]: v }));
        if (errors[id])
            setErrors(({ [id]: _drop, ...rest }) => rest);
    };
    const submit = async (e) => {
        e.preventDefault();
        const errs = validateAll(form.fields, values);
        setErrors(errs);
        const first = form.fields.find(f => errs[f.id]);
        if (first) {
            document.getElementById(`field-${first.id}`)?.focus();
            return;
        }
        setSubmitting(true);
        setBanner(null);
        try {
            const serverErrs = await onSubmit(values, Math.round((Date.now() - started) / 1000));
            if (serverErrs && Object.keys(serverErrs).length)
                setErrors(serverErrs);
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
    return (<div className="rounded-2xl border border-line bg-white" style={{ borderTop: `4px solid ${form.accent}` }}>
      {done ? (<div className="space-y-3 p-8 text-center" role="status">
          <CheckCircle2 size={40} className="mx-auto" style={{ color: form.accent }}/>
          <h2 className="text-xl font-semibold">Thank you!</h2>
          <p className="text-sm text-neutral-600">{notice ? 'This was a preview, so nothing was saved.' : 'Your response has been recorded.'}</p>
          <button onClick={reset} className="text-sm font-medium underline">Submit another response</button>
        </div>) : (<form noValidate onSubmit={submit} className="space-y-6 p-6">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight">{form.title || 'Untitled form'}</h1>
            {form.description && <p className="mt-1 text-sm text-neutral-600">{form.description}</p>}
          </header>
          {notice && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">{notice}</p>}
          {form.fields.length === 0 && <p className="text-sm text-neutral-500">This form has no fields yet.</p>}
          {form.fields.map(f => {
                const id = `field-${f.id}`;
                const group = f.type === 'multiple_choice' || f.type === 'rating';
                const label = <>{f.label || 'Untitled question'}{f.required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}</>;
                return (<div key={f.id} className="space-y-1.5">
                {group ? <p id={`${id}-label`} className="text-sm font-medium">{label}</p> : <label htmlFor={id} className="block text-sm font-medium">{label}</label>}
                {f.description && <p className="text-xs text-neutral-500">{f.description}</p>}
                <FieldInput field={f} id={id} value={values[f.id]} onChange={v => change(f.id, v)} invalid={!!errors[f.id]} accent={form.accent}/>
                {errors[f.id] && <p role="alert" className="text-xs text-red-600">{errors[f.id]}</p>}
              </div>);
            })}
          {banner && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{banner}</p>}
          <button type="submit" disabled={submitting || form.fields.length === 0} className="h-11 w-full rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: form.accent }}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </form>)}
    </div>);
}
