import { Link } from 'react-router-dom'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Card } from '../../../components/ui/Card'

/** Clickable icon+label tile that navigates to another page — a "shortcut card" for dashboards. */
export function NavTile({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <Link to={to}>
      <Card hover className="flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-950/50 text-blue-400">
          <Icon size={18} />
        </span>
        <span className="flex-1 text-sm font-medium text-slate-900">{label}</span>
        <ChevronRight size={16} className="shrink-0 text-slate-400" />
      </Card>
    </Link>
  )
}
