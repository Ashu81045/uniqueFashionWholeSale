import { Wallet } from 'lucide-react'
import { useT } from '../../../i18n/I18nContext'
import { formatPaiseAsRupees } from '../../../lib/billing/formatCurrency'
import { Card } from '../../../components/ui/Card'

const SEGMENTS = [
  { key: 'cash', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  { key: 'upi', bar: 'bg-blue-500', dot: 'bg-blue-500' },
  { key: 'bank', bar: 'bg-green-500', dot: 'bg-green-500' },
  { key: 'other', bar: 'bg-slate-400', dot: 'bg-slate-400' },
] as const

export function CollectionSplitCard({
  cashPaise,
  upiPaise,
  bankTransferPaise,
  otherPaise,
}: {
  cashPaise: number
  upiPaise: number
  bankTransferPaise: number
  otherPaise: number
}) {
  const t = useT()
  const values = { cash: cashPaise, upi: upiPaise, bank: bankTransferPaise, other: otherPaise }
  const total = cashPaise + upiPaise + bankTransferPaise + otherPaise || 1

  return (
    <Card className="animate-fade-in p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        <Wallet size={14} />
        {t('dashboard.cashCollection')} / {t('dashboard.upiCollection')}
      </p>

      <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-slate-200">
        {SEGMENTS.map(({ key, bar }) => {
          const pct = (values[key] / total) * 100
          return pct > 0 ? (
            <div
              key={key}
              className={`h-full ${bar} transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          ) : null
        })}
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <Row dot="bg-amber-500" label={t('bill.paymentMode.cash')} value={cashPaise} />
        <Row dot="bg-blue-500" label={t('dashboard.upiCollection')} value={upiPaise} />
        <Row dot="bg-green-500" label={t('bill.paymentMode.bank_transfer')} value={bankTransferPaise} />
        <Row dot="bg-slate-400" label={t('bill.paymentMode.other')} value={otherPaise} />
      </div>
    </Card>
  )
}

function Row({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </span>
      <span className="font-medium text-slate-900">{formatPaiseAsRupees(value)}</span>
    </div>
  )
}
