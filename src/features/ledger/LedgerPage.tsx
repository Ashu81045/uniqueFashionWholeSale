import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  ChevronRight,
  HandCoins,
  ReceiptText,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useT } from '../../i18n/I18nContext'
import { useCustomersList } from '../../hooks/useCustomersList'
import { useLedgerFeed } from '../../hooks/useLedgerFeed'
import { formatPaiseAsRupees } from '../../lib/billing/formatCurrency'
import { formatDisplayDate, toDateKey } from '../../lib/utils/date'
import { DateRangeFilter, type PeriodPreset } from '../../components/ui/DateRangeFilter'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { RoleGate } from '../../components/layout/RoleGate'

export function LedgerPage() {
  const t = useT()
  const { customers, loading, hasMore, loadMore } = useCustomersList()
  const { entries: feed, loading: feedLoading } = useLedgerFeed()
  const [search, setSearch] = useState('')

  // Date Range filter for transaction activity
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [preset, setPreset] = useState<PeriodPreset>('all')

  // Filtered ledger transactions feed
  const filteredFeed = useMemo(() => {
    return feed.filter((entry) => {
      if (startDate && endDate) {
        const k = toDateKey(entry.date)
        if (k < startDate || k > endDate) {
          return false
        }
      }
      return true
    })
  }, [feed, startDate, endDate])

  // Analytics for the selected period
  const feedAnalytics = useMemo(() => {
    let totalBilledPaise = 0
    let totalReceivedPaise = 0

    for (const entry of filteredFeed) {
      if (entry.type === 'bill') {
        totalBilledPaise += entry.amountPaise
      } else {
        totalReceivedPaise += entry.amountPaise
      }
    }

    return {
      count: filteredFeed.length,
      totalBilledPaise,
      totalReceivedPaise,
      netShiftPaise: totalBilledPaise - totalReceivedPaise,
    }
  }, [filteredFeed])

  // Filtered customer directory
  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q))
  }, [customers, search])

  return (
    <div className="flex animate-fade-in flex-col gap-4 p-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <BookOpen size={22} className="text-blue-400" />
          {t('nav.ledger')} — Khata & Udhar Register
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Grahako ke khate, udhar vasooli aur rozana transactions feed.
        </p>
      </div>

      {/* Date Range Filter for Ledger Feed Analytics */}
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        currentPreset={preset}
        onChange={(start, end, p) => {
          setStartDate(start)
          setEndDate(end)
          setPreset(p)
        }}
      />

      {/* Analytics Summary for the selected period */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Kul Udhar Bikri (Debits)</span>
            <TrendingUp size={15} className="text-red-400" />
          </div>
          <p className="mt-1.5 text-lg sm:text-xl font-bold text-red-400">
            + {formatPaiseAsRupees(feedAnalytics.totalBilledPaise)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Naya Udhar Maal</p>
        </div>

        <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Kul Vasooli (Credits)</span>
            <TrendingDown size={15} className="text-green-400" />
          </div>
          <p className="mt-1.5 text-lg sm:text-xl font-bold text-green-400">
            − {formatPaiseAsRupees(feedAnalytics.totalReceivedPaise)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Jama Rakam / Payment</p>
        </div>

        <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Chuna Samay Len-Den</span>
            <Wallet size={15} className="text-blue-400" />
          </div>
          <p className="mt-1.5 text-lg sm:text-xl font-bold text-slate-900">
            {feedAnalytics.count} Entries
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Bills & Payments Combined</p>
        </div>
      </div>

      {/* Recent transactions — bills (debits) and payments (credits) across every customer. */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
            {t('ledger.recentTransactions')} ({filteredFeed.length})
          </p>
          {startDate && (
            <span className="text-[11px] text-blue-400 font-semibold">
              Filter Active
            </span>
          )}
        </div>

        {feedLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : filteredFeed.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
            Is period me koi transaction nahi mili (No transactions found).
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-200">
            {filteredFeed.map((entry, i) => (
              <Link
                key={entry.key}
                to={entry.customerMobile ? `/ledger/${entry.customerMobile}` : '#'}
                style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}
                className="flex animate-fade-in items-center gap-3 px-4 py-3 [animation-fill-mode:both] transition-colors hover:bg-slate-200/40"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    entry.type === 'bill' ? 'bg-red-950/60 text-red-400 border border-red-500/30' : 'bg-green-950/60 text-green-400 border border-green-500/30'
                  }`}
                >
                  {entry.type === 'bill' ? <ReceiptText size={16} /> : <HandCoins size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {entry.customerName || entry.customerMobile || '—'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDisplayDate(entry.date)}
                    {entry.billNo != null && ` · Bill #${entry.billNo}`}
                    {entry.mode && ` · ${t(`bill.paymentMode.${entry.mode}`)}`}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold ${
                    entry.type === 'bill' ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {entry.type === 'bill' ? '+' : '−'}
                  {formatPaiseAsRupees(entry.amountPaise)}
                </span>
              </Link>
            ))}
          </div>
        )}
        <RoleGate roles={['admin']}>
          <Link
            to="/collections"
            className="block border-t border-slate-200 px-4 py-2.5 text-center text-xs font-bold text-blue-400 hover:bg-slate-200/40"
          >
            {t('common.viewAll')} Collections →
          </Link>
        </RoleGate>
      </Card>

      {/* Customer-wise due — pick a customer to view/update their ledger. */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('ledger.allCustomers')}</p>
        <span className="text-xs text-slate-400">{filteredCustomers.length} Customers</span>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('customers.search')}
          className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
        />
      </div>

      {loading && customers.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <p className="py-6 text-center text-sm font-semibold text-slate-400">—</p>
      ) : (
        <Card className="flex flex-col divide-y divide-slate-200 overflow-hidden p-0">
          {filteredCustomers.map((c, i) => (
            <Link
              key={c.mobile}
              to={`/ledger/${c.mobile}`}
              style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}
              className="flex animate-fade-in items-center gap-3 px-4 py-3 [animation-fill-mode:both] transition-colors hover:bg-slate-200/40"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-950/60 text-sm font-bold text-blue-400 border border-blue-500/30">
                {c.name[0]?.toUpperCase() ?? '?'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-400">{c.mobile}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      c.outstandingBalancePaise > 0 ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {formatPaiseAsRupees(c.outstandingBalancePaise)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {c.outstandingBalancePaise > 0 ? 'Baaki Udhar' : 'Khata Clear'}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-slate-400" />
              </div>
            </Link>
          ))}
        </Card>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={loadMore} disabled={loading} className="text-xs font-semibold">
            {loading ? <Spinner className="h-3.5 w-3.5" /> : t('common.loadMore')}
          </Button>
        </div>
      )}
    </div>
  )
}
