import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, LayoutTemplate, Settings, Menu, X, Plus, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector, logout } from '../store/index.js';
import { cn, Button } from './ui.js';
const nav = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/forms/new', label: 'Templates', icon: LayoutTemplate, end: false },
    { to: '/app/settings', label: 'Settings', icon: Settings, end: false },
];
export function Logo() {
    return (_jsxs(Link, { to: "/", className: "flex items-center gap-2 font-semibold tracking-tight", children: [_jsx("span", { className: "grid h-7 w-7 place-items-center rounded-lg bg-ink text-sm text-white", children: "F" }), "FormForge"] }));
}
export default function AppLayout() {
    const [open, setOpen] = useState(false);
    const user = useAppSelector(s => s.auth.user);
    const dispatch = useAppDispatch();
    const first = user?.name.split(' ')[0] ?? 'My';
    const workspace = user?.workspaceName || `${first}'s workspace`;
    const initials = (user?.name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return (_jsxs("div", { className: "min-h-screen lg:grid lg:grid-cols-[240px_1fr]", children: [_jsxs("aside", { className: cn('fixed inset-y-0 left-0 z-40 w-60 border-r border-line bg-white p-4 transition-transform lg:static lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full'), children: [_jsxs("div", { className: "flex items-center justify-between px-2 py-1", children: [_jsx(Logo, {}), _jsx("button", { className: "lg:hidden", "aria-label": "Close menu", onClick: () => setOpen(false), children: _jsx(X, { size: 18 }) })] }), _jsx("nav", { className: "mt-6 space-y-1", "aria-label": "Main", children: nav.map(n => (_jsxs(NavLink, { to: n.to, end: n.end, onClick: () => setOpen(false), className: ({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-accent-50 text-accent-700' : 'text-neutral-600 hover:bg-neutral-100'), children: [_jsx(n.icon, { size: 18 }), n.label] }, n.to))) }), _jsxs("div", { className: "absolute inset-x-4 bottom-4 rounded-xl border border-line p-3 text-sm", children: [_jsx("p", { className: "truncate font-medium", children: workspace }), _jsx("p", { className: "text-xs text-neutral-500", children: "Free plan" })] })] }), open && _jsx("div", { className: "fixed inset-0 z-30 bg-black/20 lg:hidden", onClick: () => setOpen(false) }), _jsxs("div", { className: "min-w-0", children: [_jsxs("header", { className: "sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur sm:px-8", children: [_jsx("button", { className: "lg:hidden", "aria-label": "Open menu", onClick: () => setOpen(true), children: _jsx(Menu, { size: 20 }) }), _jsx("span", { className: "hidden text-sm text-neutral-500 lg:block", children: workspace }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: "/app/forms/new", children: _jsxs(Button, { size: "sm", children: [_jsx(Plus, { size: 16 }), "New form"] }) }), _jsx("span", { title: user?.email, className: "grid h-8 w-8 place-items-center rounded-full bg-accent-100 text-xs font-semibold text-accent-700", children: initials }), _jsx("button", { "aria-label": "Log out", title: "Log out", onClick: () => dispatch(logout()), className: "grid h-8 w-8 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100", children: _jsx(LogOut, { size: 16 }) })] })] }), _jsx("main", { className: "mx-auto max-w-6xl p-4 sm:p-8", children: _jsx(Outlet, {}) })] })] }));
}
