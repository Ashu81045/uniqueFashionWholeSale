import { useState } from 'react'
import { LineChart } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { formatPaiseAsRupees } from '../../../lib/billing/formatCurrency'
import { formatDisplayDate } from '../../../lib/utils/date'
import { useT } from '../../../i18n/I18nContext'
import type { DailyStats } from '../../../types/dailyStats'

/** Compact 30-day bar chart. Single sequential hue (magnitude, not identity) — see dataviz skill. */
export function SalesTrendChart({ stats }: { stats: DailyStats[] }) {
  const t = useT()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const maxValue = Math.max(...stats.map((s) => s.totalSalesPaise), 1)
  const hovered = hoverIndex !== null ? stats[hoverIndex] : null

  return (
    <Card className="animate-fade-in p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
          <LineChart size={14} />
          {t('dashboard.salesTrend')}
        </p>
        {hovered && (
          <p className="text-xs font-medium text-slate-700">
            {formatDisplayDate(new Date(hovered.date))} · {formatPaiseAsRupees(hovered.totalSalesPaise)}
          </p>
        )}
      </div>

      <div className="flex h-28 items-end gap-[2px]" onMouseLeave={() => setHoverIndex(null)}>
        {stats.map((day, i) => {
          const heightPct = Math.max((day.totalSalesPaise / maxValue) * 100, 2)
          const isHovered = hoverIndex === i
          return (
            <div
              key={day.date}
              className="group relative flex-1"
              onMouseEnter={() => setHoverIndex(i)}
            >
              <div
                className={`w-full rounded-t transition-all duration-150 ${
                  isHovered ? 'bg-blue-700' : 'bg-blue-400'
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>{stats[0] && formatDisplayDate(new Date(stats[0].date))}</span>
        <span>{stats[stats.length - 1] && formatDisplayDate(new Date(stats[stats.length - 1].date))}</span>
      </div>
    </Card>
  )
}
