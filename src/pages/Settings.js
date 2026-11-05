import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Building2, FileText, Lock, Palette, User as UserIcon, Monitor, Moon, Sun } from 'lucide-react';
import { changeEmail, changePassword, deleteAccount, logout, saveProfile, useAppDispatch, useAppSelector } from '../store/index.js';
import { Button, Dialog, Input, Toggle, cn } from '../components/ui.js';
import { SWATCHES } from './EditorPanels.js';
import { getTheme, setTheme } from '../services/theme.js';
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
const Status = ({ msg }) => msg && _jsx("p", { role: msg.ok ? 'status' : 'alert', className: cn('text-sm', msg.ok ? 'text-emerald-700' : 'text-red-600'), children: msg.text });
const Section = ({ title, desc, children }) => (_jsxs("section", { className: "space-y-4 rounded-xl border border-line bg-white p-5", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-medium", children: title }), desc && _jsx("p", { className: "mt-0.5 text-sm text-neutral-500", children: desc })] }), children] }));
const Label = ({ text, children }) => _jsxs("label", { className: "block space-y-1.5", children: [_jsx("span", { className: "text-xs font-medium text-neutral-600", children: text }), children] });
function Profile({ user }) {
    const dispatch = useAppDispatch();
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [pass, setPass] = useState('');
    const a = useAction();
    const b = useAction();
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs(Section, { title: "Profile information", desc: "Your name appears in the app and on your workspace.", children: [_jsx(Label, { text: "Full name", children: _jsx(Input, { value: name, onChange: e => setName(e.target.value) }) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Button, { disabled: a.busy || !name.trim() || name.trim() === user.name, onClick: () => a.run(() => dispatch(saveProfile({ name: name.trim() })).unwrap(), 'Profile saved.'), children: "Save" }), _jsx(Status, { msg: a.msg })] })] }), _jsxs(Section, { title: "Email address", desc: "Changing your email requires your current password.", children: [_jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(Label, { text: "Email", children: _jsx(Input, { type: "email", value: email, onChange: e => setEmail(e.target.value) }) }), _jsx(Label, { text: "Current password", children: _jsx(Input, { type: "password", autoComplete: "current-password", value: pass, onChange: e => setPass(e.target.value) }) })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Button, { disabled: b.busy || !pass || email.trim().toLowerCase() === user.email, onClick: () => b.run(async () => { await dispatch(changeEmail({ email: email.trim(), password: pass })).unwrap(); setPass(''); }, 'Email updated.'), children: "Update email" }), _jsx(Status, { msg: b.msg })] })] })] }));
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
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs(Section, { title: "Change password", children: [_jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsx(Label, { text: "Current password", children: _jsx(Input, { type: "password", autoComplete: "current-password", value: cur, onChange: e => setCur(e.target.value) }) }), _jsx(Label, { text: "New password", children: _jsx(Input, { type: "password", autoComplete: "new-password", value: next, onChange: e => setNext(e.target.value) }) }), _jsx(Label, { text: "Confirm new password", children: _jsx(Input, { type: "password", autoComplete: "new-password", value: again, onChange: e => setAgain(e.target.value) }) })] }), error && _jsx("p", { role: "alert", className: "text-sm text-red-600", children: error }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Button, { disabled: a.busy || !cur || next.length < 8 || next !== again, onClick: () => a.run(async () => { await dispatch(changePassword({ currentPassword: cur, newPassword: next })).unwrap(); setCur(''); setNext(''); setAgain(''); }, 'Password changed.'), children: "Change password" }), _jsx(Status, { msg: a.msg })] })] }), _jsx(Section, { title: "Delete account", desc: "Permanently deletes your account, all forms and all responses. This can't be undone.", children: _jsx(Button, { variant: "danger", onClick: () => { setDelPass(''); d.run(async () => { }, ''); setOpen(true); }, children: "Delete my account" }) }), _jsxs(Dialog, { open: open, onClose: () => setOpen(false), title: "Delete your account?", children: [_jsx("p", { children: "Enter your password to confirm. All of your forms and responses will be deleted." }), _jsx(Input, { type: "password", "aria-label": "Password", autoComplete: "current-password", className: "mt-3", value: delPass, onChange: e => setDelPass(e.target.value) }), _jsx("div", { className: "mt-3", children: _jsx(Status, { msg: d.msg && !d.msg.ok ? d.msg : null }) }), _jsxs("div", { className: "mt-5 flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setOpen(false), children: "Cancel" }), _jsx(Button, { variant: "danger", disabled: d.busy || !delPass, onClick: () => d.run(async () => { await dispatch(deleteAccount({ password: delPass })).unwrap(); dispatch(logout()); navigate('/'); }, ''), children: "Delete account" })] })] })] }));
}
function Workspace({ user }) {
    const dispatch = useAppDispatch();
    const [name, setName] = useState(user.workspaceName);
    const a = useAction();
    return (_jsxs(Section, { title: "Workspace", desc: "Shown in the sidebar and the editor header. Leave blank to use the default.", children: [_jsx(Label, { text: "Workspace name", children: _jsx(Input, { value: name, maxLength: 100, placeholder: `${user.name.split(' ')[0]}'s workspace`, onChange: e => setName(e.target.value) }) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Button, { disabled: a.busy || name.trim() === user.workspaceName, onClick: () => a.run(() => dispatch(saveProfile({ workspaceName: name.trim() })).unwrap(), 'Workspace saved.'), children: "Save" }), _jsx(Status, { msg: a.msg })] })] }));
}
function FormDefaults({ user }) {
    const dispatch = useAppDispatch();
    const [accent, setAccent] = useState(user.defaultAccent);
    const a = useAction();
    return (_jsxs(Section, { title: "Form defaults", desc: "New forms start with this accent colour. Existing forms are not changed.", children: [_jsx("div", { className: "flex flex-wrap gap-2", children: SWATCHES.map(c => _jsx("button", { "aria-label": `Accent ${c}`, "aria-pressed": accent === c, onClick: () => setAccent(c), style: { background: c }, className: cn('h-8 w-8 rounded-full border-2', accent === c ? 'border-ink' : 'border-white ring-1 ring-line') }, c)) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Button, { disabled: a.busy || accent === user.defaultAccent, onClick: () => a.run(() => dispatch(saveProfile({ defaultAccent: accent })).unwrap(), 'Default saved.'), children: "Save" }), _jsx(Status, { msg: a.msg })] })] }));
}
function Notifications({ user }) {
    const dispatch = useAppDispatch();
    const [n, setN] = useState(user.notifications);
    const a = useAction();
    const changed = n.newResponse !== user.notifications.newResponse || n.weeklyDigest !== user.notifications.weeklyDigest;
    return (_jsxs(Section, { title: "Notification preferences", desc: "Your choices are saved to your account. Emails are not sent yet because no email service is connected to the server.", children: [[['newResponse', 'New response alerts', 'Get an email whenever someone submits one of your forms.'], ['weeklyDigest', 'Weekly digest', 'A summary of responses across your forms every Monday.']].map(([k, t, d]) => (_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: t }), _jsx("p", { className: "text-xs text-neutral-500", children: d })] }), _jsx(Toggle, { label: t, checked: n[k], onChange: v => setN(s => ({ ...s, [k]: v })) })] }, k))), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Button, { disabled: a.busy || !changed, onClick: () => a.run(() => dispatch(saveProfile({ notifications: n })).unwrap(), 'Preferences saved.'), children: "Save" }), _jsx(Status, { msg: a.msg })] })] }));
}
function Appearance() {
    const [theme, set] = useState(getTheme);
    const opts = [['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]];
    return (_jsx(Section, { title: "Appearance", desc: "Applies to this browser only.", children: _jsx("div", { className: "grid gap-3 sm:grid-cols-3", role: "radiogroup", "aria-label": "Theme", children: opts.map(([v, l, Icon]) => (_jsxs("button", { role: "radio", "aria-checked": theme === v, onClick: () => { setTheme(v); set(v); }, className: cn('flex items-center gap-2 rounded-lg border p-3 text-sm font-medium', theme === v ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-line hover:bg-neutral-50'), children: [_jsx(Icon, { size: 16 }), l] }, v))) }) }));
}
const TABS = [['profile', 'Profile', UserIcon], ['account', 'Account', Lock], ['workspace', 'Workspace', Building2], ['forms', 'Form defaults', FileText], ['notifications', 'Notifications', Bell], ['appearance', 'Appearance', Palette]];
export default function Settings() {
    const user = useAppSelector(s => s.auth.user);
    const [tab, setTab] = useState('profile');
    if (!user)
        return null;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Settings" }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: "Manage your account, workspace and preferences." })] }), _jsxs("div", { className: "grid gap-6 md:grid-cols-[200px_1fr]", children: [_jsx("nav", { "aria-label": "Settings sections", className: "flex gap-1 overflow-x-auto md:flex-col", children: TABS.map(([k, l, Icon]) => (_jsxs("button", { "aria-current": tab === k ? 'page' : undefined, onClick: () => setTab(k), className: cn('flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium', tab === k ? 'bg-accent-50 text-accent-700' : 'text-neutral-600 hover:bg-neutral-100'), children: [_jsx(Icon, { size: 16 }), l] }, k))) }), _jsxs("div", { className: "min-w-0 max-w-2xl", children: [tab === 'profile' && _jsx(Profile, { user: user }), tab === 'account' && _jsx(Account, {}), tab === 'workspace' && _jsx(Workspace, { user: user }), tab === 'forms' && _jsx(FormDefaults, { user: user }), tab === 'notifications' && _jsx(Notifications, { user: user }), tab === 'appearance' && _jsx(Appearance, {})] })] })] }));
}
