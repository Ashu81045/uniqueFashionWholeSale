import type { LucideIcon } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { formatPaiseAsRupees } from '../../../lib/billing/formatCurrency'

export interface TopListRow {
  key: string
  label: string
  sublabel?: string
  valuePaise: number
}

/**
 * Ranked list with a proportional bar per row. Each row is a different,
 * unbounded entity (a customer/product name), so — per the magnitude-encoding
 * rule — bars use a single sequential hue rather than one color per row;
 * identity comes from the label text, not color.
 */
export function TopList({
  title,
  icon: Icon,
  rows,
}: {
  title?: string
  icon?: LucideIcon
  rows: TopListRow[]
}) {
  const maxValue = Math.max(...rows.map((r) => r.valuePaise), 1)

  return (
    <Card className="animate-fade-in p-4">
      {title && (
        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
          {Icon && <Icon size={14} />}
          {title}
        </p>
      )}
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">—</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <div
              key={row.key}
              style={{ animationDelay: `${i * 60}ms` }}
              className="flex animate-fade-in flex-col gap-1 [animation-fill-mode:both]"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-500">
                    {i + 1}
                  </span>
                  <span className="truncate font-medium text-slate-800">{row.label}</span>
                </span>
                <span className="flex shrink-0 items-baseline gap-1.5">
                  {row.sublabel && <span className="text-xs text-slate-500">{row.sublabel}</span>}
                  <span className="font-medium text-slate-900">{formatPaiseAsRupees(row.valuePaise)}</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(row.valuePaise / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
