import { jsx as _jsx } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { cn } from './ui.js';
export default function FormTabs({ id }) {
    const tabs = [['edit', 'Edit'], ['preview', 'Preview'], ['share', 'Share'], ['responses', 'Responses'], ['analytics', 'Analytics']];
    return (_jsx("nav", { "aria-label": "Form sections", className: "flex gap-1 overflow-x-auto border-b border-line", children: tabs.map(([p, l]) => (_jsx(NavLink, { to: `/app/forms/${id}/${p}`, className: ({ isActive }) => cn('whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium', isActive ? 'border-ink text-ink' : 'border-transparent text-neutral-500 hover:text-ink'), children: l }, p))) }));
}
