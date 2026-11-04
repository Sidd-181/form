import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Building2, FileText, Lock, Palette, User as UserIcon, Monitor, Moon, Sun } from 'lucide-react';
import { changeEmail, changePassword, deleteAccount, logout, saveProfile, useAppDispatch, useAppSelector } from '../store';
import { Button, Dialog, Input, Toggle, cn } from '../components/ui';
import { SWATCHES } from './EditorPanels';
import { getTheme, setTheme } from '../services/theme';
function useAction() {
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    const run = async (fn, ok) => {
        setBusy(true);
        setMsg(null);
        try {
            await fn();
            setMsg({ ok: true, text: ok });
        }
        catch (e) {
            setMsg({ ok: false, text: e.message ?? 'Something went wrong' });
        }
        finally {
            setBusy(false);
        }
    };
    return { msg, busy, run };
}
const Status = ({ msg }) => msg && <p role={msg.ok ? 'status' : 'alert'} className={cn('text-sm', msg.ok ? 'text-emerald-700' : 'text-red-600')}>{msg.text}</p>;
const Section = ({ title, desc, children }) => (<section className="space-y-4 rounded-xl border border-line bg-white p-5"><div><h2 className="font-medium">{title}</h2>{desc && <p className="mt-0.5 text-sm text-neutral-500">{desc}</p>}</div>{children}</section>);
const Label = ({ text, children }) => <label className="block space-y-1.5"><span className="text-xs font-medium text-neutral-600">{text}</span>{children}</label>;
function Profile({ user }) {
    const dispatch = useAppDispatch();
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [pass, setPass] = useState('');
    const a = useAction();
    const b = useAction();
    return (<div className="space-y-5">
      <Section title="Profile information" desc="Your name appears in the app and on your workspace.">
        <Label text="Full name"><Input value={name} onChange={e => setName(e.target.value)}/></Label>
        <div className="flex items-center gap-3"><Button disabled={a.busy || !name.trim() || name.trim() === user.name} onClick={() => a.run(() => dispatch(saveProfile({ name: name.trim() })).unwrap(), 'Profile saved.')}>Save</Button><Status msg={a.msg}/></div>
      </Section>
      <Section title="Email address" desc="Changing your email requires your current password.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Label text="Email"><Input type="email" value={email} onChange={e => setEmail(e.target.value)}/></Label>
          <Label text="Current password"><Input type="password" autoComplete="current-password" value={pass} onChange={e => setPass(e.target.value)}/></Label>
        </div>
        <div className="flex items-center gap-3"><Button disabled={b.busy || !pass || email.trim().toLowerCase() === user.email} onClick={() => b.run(async () => { await dispatch(changeEmail({ email: email.trim(), password: pass })).unwrap(); setPass(''); }, 'Email updated.')}>Update email</Button><Status msg={b.msg}/></div>
      </Section>
    </div>);
}
function Account() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [cur, setCur] = useState('');
    const [next, setNext] = useState('');
    const [again, setAgain] = useState('');
    const [open, setOpen] = useState(false);
    const [delPass, setDelPass] = useState('');
    const a = useAction();
    const d = useAction();
    const error = next && next.length < 8 ? 'Use at least 8 characters.' : again && again !== next ? 'Passwords do not match.' : null;
    return (<div className="space-y-5">
      <Section title="Change password">
        <div className="grid gap-4 sm:grid-cols-3">
          <Label text="Current password"><Input type="password" autoComplete="current-password" value={cur} onChange={e => setCur(e.target.value)}/></Label>
          <Label text="New password"><Input type="password" autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)}/></Label>
          <Label text="Confirm new password"><Input type="password" autoComplete="new-password" value={again} onChange={e => setAgain(e.target.value)}/></Label>
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-3"><Button disabled={a.busy || !cur || next.length < 8 || next !== again} onClick={() => a.run(async () => { await dispatch(changePassword({ currentPassword: cur, newPassword: next })).unwrap(); setCur(''); setNext(''); setAgain(''); }, 'Password changed.')}>Change password</Button><Status msg={a.msg}/></div>
      </Section>
      <Section title="Delete account" desc="Permanently deletes your account, all forms and all responses. This can't be undone.">
        <Button variant="danger" onClick={() => { setDelPass(''); d.run(async () => { }, ''); setOpen(true); }}>Delete my account</Button>
      </Section>
      <Dialog open={open} onClose={() => setOpen(false)} title="Delete your account?">
        <p>Enter your password to confirm. All of your forms and responses will be deleted.</p>
        <Input type="password" aria-label="Password" autoComplete="current-password" className="mt-3" value={delPass} onChange={e => setDelPass(e.target.value)}/>
        <div className="mt-3"><Status msg={d.msg && !d.msg.ok ? d.msg : null}/></div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="danger" disabled={d.busy || !delPass} onClick={() => d.run(async () => { await dispatch(deleteAccount({ password: delPass })).unwrap(); dispatch(logout()); navigate('/'); }, '')}>Delete account</Button>
        </div>
      </Dialog>
    </div>);
}
function Workspace({ user }) {
    const dispatch = useAppDispatch();
    const [name, setName] = useState(user.workspaceName);
    const a = useAction();
    return (<Section title="Workspace" desc="Shown in the sidebar and the editor header. Leave blank to use the default.">
      <Label text="Workspace name"><Input value={name} maxLength={100} placeholder={`${user.name.split(' ')[0]}'s workspace`} onChange={e => setName(e.target.value)}/></Label>
      <div className="flex items-center gap-3"><Button disabled={a.busy || name.trim() === user.workspaceName} onClick={() => a.run(() => dispatch(saveProfile({ workspaceName: name.trim() })).unwrap(), 'Workspace saved.')}>Save</Button><Status msg={a.msg}/></div>
    </Section>);
}
function FormDefaults({ user }) {
    const dispatch = useAppDispatch();
    const [accent, setAccent] = useState(user.defaultAccent);
    const a = useAction();
    return (<Section title="Form defaults" desc="New forms start with this accent colour. Existing forms are not changed.">
      <div className="flex flex-wrap gap-2">{SWATCHES.map(c => <button key={c} aria-label={`Accent ${c}`} aria-pressed={accent === c} onClick={() => setAccent(c)} style={{ background: c }} className={cn('h-8 w-8 rounded-full border-2', accent === c ? 'border-ink' : 'border-white ring-1 ring-line')}/>)}</div>
      <div className="flex items-center gap-3"><Button disabled={a.busy || accent === user.defaultAccent} onClick={() => a.run(() => dispatch(saveProfile({ defaultAccent: accent })).unwrap(), 'Default saved.')}>Save</Button><Status msg={a.msg}/></div>
    </Section>);
}
function Notifications({ user }) {
    const dispatch = useAppDispatch();
    const [n, setN] = useState(user.notifications);
    const a = useAction();
    const changed = n.newResponse !== user.notifications.newResponse || n.weeklyDigest !== user.notifications.weeklyDigest;
    return (<Section title="Notification preferences" desc="Your choices are saved to your account. Emails are not sent yet because no email service is connected to the server.">
      {[['newResponse', 'New response alerts', 'Get an email whenever someone submits one of your forms.'], ['weeklyDigest', 'Weekly digest', 'A summary of responses across your forms every Monday.']].map(([k, t, d]) => (<div key={k} className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{t}</p><p className="text-xs text-neutral-500">{d}</p></div><Toggle label={t} checked={n[k]} onChange={v => setN(s => ({ ...s, [k]: v }))}/></div>))}
      <div className="flex items-center gap-3"><Button disabled={a.busy || !changed} onClick={() => a.run(() => dispatch(saveProfile({ notifications: n })).unwrap(), 'Preferences saved.')}>Save</Button><Status msg={a.msg}/></div>
    </Section>);
}
function Appearance() {
    const [theme, set] = useState(getTheme);
    const opts = [['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]];
    return (<Section title="Appearance" desc="Applies to this browser only.">
      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
        {opts.map(([v, l, Icon]) => (<button key={v} role="radio" aria-checked={theme === v} onClick={() => { setTheme(v); set(v); }} className={cn('flex items-center gap-2 rounded-lg border p-3 text-sm font-medium', theme === v ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-line hover:bg-neutral-50')}><Icon size={16}/>{l}</button>))}
      </div>
    </Section>);
}
const TABS = [['profile', 'Profile', UserIcon], ['account', 'Account', Lock], ['workspace', 'Workspace', Building2], ['forms', 'Form defaults', FileText], ['notifications', 'Notifications', Bell], ['appearance', 'Appearance', Palette]];
export default function Settings() {
    const user = useAppSelector(s => s.auth.user);
    const [tab, setTab] = useState('profile');
    if (!user)
        return null;
    return (<div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Settings</h1><p className="mt-1 text-sm text-neutral-500">Manage your account, workspace and preferences.</p></div>
      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto md:flex-col">
          {TABS.map(([k, l, Icon]) => (<button key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)} className={cn('flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium', tab === k ? 'bg-accent-50 text-accent-700' : 'text-neutral-600 hover:bg-neutral-100')}><Icon size={16}/>{l}</button>))}
        </nav>
        <div className="min-w-0 max-w-2xl">
          {tab === 'profile' && <Profile user={user}/>}
          {tab === 'account' && <Account />}
          {tab === 'workspace' && <Workspace user={user}/>}
          {tab === 'forms' && <FormDefaults user={user}/>}
          {tab === 'notifications' && <Notifications user={user}/>}
          {tab === 'appearance' && <Appearance />}
        </div>
      </div>
    </div>);
}
