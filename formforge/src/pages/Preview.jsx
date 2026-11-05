import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Monitor, Smartphone, Pencil } from 'lucide-react';
import WithForm from '../components/WithForm';
import FormRenderer from '../components/FormRenderer';
import { Badge, Button, cn } from '../components/ui';
function PreviewView({ form }) {
    const [device, setDevice] = useState('desktop');
    return (<div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/app" aria-label="Back to dashboard" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-neutral-100"><ArrowLeft size={18}/></Link>
          <h1 className="text-xl font-semibold tracking-tight">Preview</h1>
          <Badge tone={form.status === 'published' ? 'green' : 'neutral'}>{form.status === 'published' ? 'Published' : 'Draft'}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-line bg-white p-0.5" role="group" aria-label="Device">
            {[['desktop', Monitor], ['mobile', Smartphone]].map(([d, Icon]) => (<button key={d} aria-pressed={device === d} onClick={() => setDevice(d)} className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm capitalize', device === d ? 'bg-ink text-white' : 'text-neutral-600')}><Icon size={14}/>{d}</button>))}
          </div>
          <Link to={`/app/forms/${form.id}/edit`}><Button variant="secondary" size="sm"><Pencil size={14}/>Edit</Button></Link>
          <Link to={`/app/forms/${form.id}/share`}><Button size="sm">Publish & share</Button></Link>
        </div>
      </div>
      <div className="dot-grid rounded-xl border border-line p-4 sm:p-8">
        <div className={cn('mx-auto transition-all', device === 'mobile' ? 'max-w-[390px] rounded-[2rem] border-[10px] border-ink bg-canvas p-3' : 'max-w-2xl')}>
          <FormRenderer form={form} notice="Preview mode: responses are validated but not saved." onSubmit={async () => { }}/>
        </div>
      </div>
    </div>);
}
export default function Preview() { return <WithForm>{f => <PreviewView form={f}/>}</WithForm>; }
