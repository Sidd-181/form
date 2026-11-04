import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, LayoutTemplate, Settings, Menu, X, Plus, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector, logout } from '../store';
import { cn, Button } from './ui';
const nav = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/forms/new', label: 'Templates', icon: LayoutTemplate, end: false },
    { to: '/app/settings', label: 'Settings', icon: Settings, end: false },
];
export function Logo() {
    return (<Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-sm text-white">F</span>FormForge
    </Link>);
}
export default function AppLayout() {
    const [open, setOpen] = useState(false);
    const user = useAppSelector(s => s.auth.user);
    const dispatch = useAppDispatch();
    const first = user?.name.split(' ')[0] ?? 'My';
    const workspace = user?.workspaceName || `${first}'s workspace`;
    const initials = (user?.name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return (<div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-60 border-r border-line bg-white p-4 transition-transform lg:static lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between px-2 py-1">
          <Logo />
          <button className="lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}><X size={18}/></button>
        </div>
        <nav className="mt-6 space-y-1" aria-label="Main">
          {nav.map(n => (<NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)} className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-accent-50 text-accent-700' : 'text-neutral-600 hover:bg-neutral-100')}>
              <n.icon size={18}/>{n.label}
            </NavLink>))}
        </nav>
        <div className="absolute inset-x-4 bottom-4 rounded-xl border border-line p-3 text-sm">
          <p className="truncate font-medium">{workspace}</p>
          <p className="text-xs text-neutral-500">Free plan</p>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setOpen(false)}/>}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur sm:px-8">
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={20}/></button>
          <span className="hidden text-sm text-neutral-500 lg:block">{workspace}</span>
          <div className="flex items-center gap-3">
            <Link to="/app/forms/new"><Button size="sm"><Plus size={16}/>New form</Button></Link>
            <span title={user?.email} className="grid h-8 w-8 place-items-center rounded-full bg-accent-100 text-xs font-semibold text-accent-700">{initials}</span>
            <button aria-label="Log out" title="Log out" onClick={() => dispatch(logout())} className="grid h-8 w-8 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"><LogOut size={16}/></button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-8"><Outlet /></main>
      </div>
    </div>);
}
