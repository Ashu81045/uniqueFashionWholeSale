import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HandCoins, Inbox, PiggyBank, Users2 } from 'lucide-react'
import { useT } from '../../i18n/I18nContext'
import { useAuthStore } from '../../stores/authStore'
import { useCollectionsList } from '../../hooks/useCollectionsList'
import { useCollectorSummary } from '../../hooks/useCollectorSummary'
import { formatPaiseAsRupees, rupeesToPaise } from '../../lib/billing/formatCurrency'
import { formatDisplayDate } from '../../lib/utils/date'
import { recordPayment } from '../ledger/ledgerService'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { CustomerLookupField } from '../customers/CustomerLookupField'
import { TopList, type TopListRow } from '../dashboard/components/TopList'
import type { Customer } from '../../types/customer'
import type { PaymentMode } from '../../types/payment'

const PAYMENT_MODES: PaymentMode[] = ['cash', 'upi', 'gpay', 'phonepe', 'bank_transfer', 'other']

function toTopListRows(
  rows: ReturnType<typeof useCollectorSummary>['today'],
  entriesLabel: string,
): TopListRow[] {
  return rows.map((r) => ({
    key: r.uid,
    label: r.name,
    sublabel: `${r.count} ${entriesLabel}`,
    valuePaise: r.totalPaise,
  }))
}

export function CollectionsPage() {
  const t = useT()
  const session = useAuthStore((s) => s.session)
  const { payments, loading: historyLoading, hasMore, loadMore, refresh: refreshHistory } = useCollectionsList()
  const { today, week, loading: summaryLoading, refresh: refreshSummary } = useCollectorSummary()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<PaymentMode>('cash')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [period, setPeriod] = useState<'today' | 'week'>('today')

  const isAdmin = session?.role === 'admin'
  const periodRows = period === 'today' ? today : week
  const visibleRows = isAdmin ? periodRows : periodRows.filter((r) => r.uid === session?.uid)

  async function handleLogCollection() {
    if (!customer || !session) return
    const amountPaise = rupeesToPaise(Number(amount))
    if (amountPaise <= 0) return
    setSaving(true)
    try {
      await recordPayment(customer.mobile, amountPaise, mode, note, session.uid, session.role)
      setCustomer(null)
      setAmount('')
      setNote('')
      await Promise.all([refreshHistory(), refreshSummary()])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex animate-fade-in flex-col gap-4 p-4">
      <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <HandCoins size={20} className="text-blue-600" />
        {t('collections.title')}
      </h1>

      {/* Log a Collection — same underlying write as a customer's ledger page,
          just reachable without navigating there first. */}
      <Card className="flex flex-col gap-3 p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <PiggyBank size={16} />
          {t('collections.logCollection')}
        </h2>
        <CustomerLookupField onSelect={setCustomer} />
        {customer && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label={t('ledger.recordPayment')}
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">{t('bill.paymentMode')}</span>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as PaymentMode)}
                  className="min-h-11 rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {PAYMENT_MODES.map((m) => (
                    <option key={m} value={m}>
                      {t(`bill.paymentMode.${m}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Input label={t('ledger.remarks')} value={note} onChange={(e) => setNote(e.target.value)} />
            <Button onClick={handleLogCollection} disabled={saving || !amount} className="self-start">
              {saving ? <Spinner tone="dark" /> : t('common.save')}
            </Button>
          </>
        )}
      </Card>

      {/* Collector Summary — admins see every collector, accountants see only their own row. */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Users2 size={16} />
            {isAdmin ? t('collections.collectorSummary') : t('collections.myCollections')}
          </h2>
          <div className="flex gap-1 rounded-lg bg-slate-200 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setPeriod('today')}
              className={`rounded-md px-2.5 py-1 transition-colors ${period === 'today' ? 'bg-blue-600 text-slate-50' : 'text-slate-600 hover:bg-slate-300/60'}`}
            >
              {t('common.today')}
            </button>
            <button
              type="button"
              onClick={() => setPeriod('week')}
              className={`rounded-md px-2.5 py-1 transition-colors ${period === 'week' ? 'bg-blue-600 text-slate-50' : 'text-slate-600 hover:bg-slate-300/60'}`}
            >
              {t('common.thisWeek')}
            </button>
          </div>
        </div>
        {summaryLoading && periodRows.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <TopList rows={toTopListRows(visibleRows, t('collections.entries'))} />
        )}
      </div>

      {/* Recent history — every payment across every customer (rules already
          allow any active staff to read this, not just admins). */}
      <h2 className="text-sm font-semibold text-slate-700">{t('collections.history')}</h2>
      {historyLoading && payments.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : payments.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <Inbox size={28} className="text-slate-300" />
          <p className="text-sm text-slate-500">—</p>
        </Card>
      ) : (
        <Card className="flex flex-col divide-y divide-slate-200 overflow-hidden p-0">
          {payments.map((p, i) => (
            <Link
              key={p.id}
              to={p.customerMobile ? `/ledger/${p.customerMobile}` : '#'}
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
              className="flex animate-fade-in items-center gap-3 px-4 py-3 [animation-fill-mode:both] transition-colors hover:bg-blue-950/30"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-950/50 text-green-400">
                <HandCoins size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{p.customerMobile ?? '—'}</p>
                <p className="text-xs text-slate-500">
                  {formatDisplayDate(p.createdAt?.toDate?.() ?? new Date())} · {t(`bill.paymentMode.${p.mode}`)}
                </p>
              </div>
              <p className="text-sm font-semibold text-green-400">{formatPaiseAsRupees(p.amountPaise)}</p>
            </Link>
          ))}
        </Card>
      )}

      {hasMore && (
        <Button variant="secondary" onClick={loadMore} disabled={historyLoading} className="self-center">
          {historyLoading ? <Spinner /> : t('common.viewAll')}
        </Button>
      )}
    </div>
  )
}
