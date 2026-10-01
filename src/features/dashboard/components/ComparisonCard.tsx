import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { formatPaiseAsRupees } from '../../../lib/billing/formatCurrency'

export function ComparisonCard({
  label,
  currentPaise,
  previousPaise,
}: {
  label: string
  currentPaise: number
  previousPaise: number
}) {
  const deltaPct =
    previousPaise === 0
      ? currentPaise > 0
        ? 100
        : 0
      : Math.round(((currentPaise - previousPaise) / previousPaise) * 100)
  const isUp = deltaPct >= 0

  return (
    <Card className="animate-fade-in p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-xl font-semibold text-slate-900">{formatPaiseAsRupees(currentPaise)}</p>
        <span
          className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
            isUp ? 'bg-green-950/50 text-green-400' : 'bg-red-950/50 text-red-400'
          }`}
        >
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(deltaPct)}%
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-400">Previous: {formatPaiseAsRupees(previousPaise)}</p>
    </Card>
  )
}
