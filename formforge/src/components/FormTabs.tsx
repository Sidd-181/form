import { NavLink } from 'react-router-dom'
import { cn } from './ui'

export default function FormTabs({ id }: { id: string }) {
  const tabs = [['edit', 'Edit'], ['preview', 'Preview'], ['share', 'Share'], ['responses', 'Responses'], ['analytics', 'Analytics']]
  return (
    <nav aria-label="Form sections" className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map(([p, l]) => (
        <NavLink key={p} to={`/app/forms/${id}/${p}`} className={({ isActive }) => cn('whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium', isActive ? 'border-ink text-ink' : 'border-transparent text-neutral-500 hover:text-ink')}>{l}</NavLink>
      ))}
    </nav>
  )
}
