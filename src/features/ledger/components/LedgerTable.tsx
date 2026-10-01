import { useT } from '../../../i18n/I18nContext'
import { formatPaiseAsRupees } from '../../../lib/billing/formatCurrency'
import { formatDisplayDate } from '../../../lib/utils/date'
import { Card } from '../../../components/ui/Card'
import type { LedgerRow } from '../ledgerService'

export function LedgerTable({ rows, openingBalancePaise }: { rows: LedgerRow[]; openingBalancePaise: number }) {
  const t = useT()
  let running = openingBalancePaise

  return (
    <Card className="animate-fade-in overflow-x-auto p-0">
      <table className="w-full min-w-[500px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-blue-950/30 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2.5">{t('common.date')}</th>
            <th className="px-3 py-2.5">{t('ledger.billNo')}</th>
            <th className="px-3 py-2.5 text-right">{t('ledger.debit')}</th>
            <th className="px-3 py-2.5 text-right">{t('ledger.credit')}</th>
            <th className="px-3 py-2.5 text-right">{t('ledger.balance')}</th>
            <th className="px-3 py-2.5">{t('ledger.remarks')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            running += row.debitPaise - row.creditPaise
            return (
              <tr key={i} className="border-b border-slate-200 transition-colors hover:bg-slate-50">
                <td className="px-3 py-2.5 text-slate-600">{formatDisplayDate(row.date)}</td>
                <td className="px-3 py-2.5 text-slate-600">{row.billNo ?? '—'}</td>
                <td className="px-3 py-2.5 text-right text-red-400">
                  {row.debitPaise > 0 ? formatPaiseAsRupees(row.debitPaise) : '—'}
                </td>
                <td className="px-3 py-2.5 text-right text-green-400">
                  {row.creditPaise > 0 ? formatPaiseAsRupees(row.creditPaise) : '—'}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-slate-900">
                  {formatPaiseAsRupees(running)}
                </td>
                <td className="px-3 py-2.5 text-slate-500">{row.remarks}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}
