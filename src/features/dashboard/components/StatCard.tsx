import type { LucideIcon } from 'lucide-react'
import { Card } from '../../../components/ui/Card'

type Tone = 'blue' | 'green' | 'amber' | 'red'

const toneClasses: Record<Tone, string> = {
  blue: 'bg-blue-950/50 text-blue-400',
  green: 'bg-green-950/50 text-green-400',
  amber: 'bg-amber-950/50 text-amber-400',
  red: 'bg-red-950/50 text-red-400',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'blue',
}: {
  label: string
  value: string
  icon?: LucideIcon
  tone?: Tone
}) {
  return (
    <Card hover className="animate-fade-in p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {Icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </Card>
  )
}
