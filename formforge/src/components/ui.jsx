import { useEffect } from 'react';
export const cn = (...c) => c.filter(Boolean).join(' ');
const variants = {
    primary: 'bg-ink text-white hover:bg-neutral-800',
    secondary: 'bg-white text-ink border border-line hover:bg-neutral-50',
    ghost: 'text-neutral-600 hover:bg-neutral-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
};
export function Button({ variant = 'primary', size = 'md', className, ...p }) {
    return <button {...p} className={cn('inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:opacity-50', size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4 text-sm', variants[variant], className)}/>;
}
export function Input({ className, ...p }) {
    return <input {...p} className={cn('h-10 w-full rounded-lg border border-line bg-white px-3 text-sm placeholder:text-neutral-400 focus:border-accent-500 focus:outline-2 focus:outline-accent-100', className)}/>;
}
export function Toggle({ checked, onChange, label }) {
    return (<button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn('relative h-5 w-9 rounded-full transition-colors', checked ? 'bg-accent-600' : 'bg-neutral-300')}>
      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', checked ? 'left-[18px]' : 'left-0.5')}/>
    </button>);
}
export function Badge({ tone, children }) {
    return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', tone === 'green' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600')}>{children}</span>;
}
export function Dialog({ open, title, children, onClose, wide }) {
    useEffect(() => {
        if (!open)
            return;
        const h = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [open, onClose]);
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()} className={cn('max-h-[85vh] w-full overflow-y-auto rounded-2xl border border-line bg-white p-6', wide ? 'max-w-xl' : 'max-w-md')}>
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-2 text-sm text-neutral-600">{children}</div>
      </div>
    </div>);
}
