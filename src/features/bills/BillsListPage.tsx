import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  Clock,
  Coins,
  FileClock,
  Inbox,
  Receipt,
  RefreshCw,
  Search,
  TrendingUp,
} from 'lucide-react'
import { useT } from '../../i18n/I18nContext'
import { useBillsList } from '../../hooks/useBillsList'
import { useDraftBills } from '../../hooks/useDraftBills'
import { formatPaiseAsRupees } from '../../lib/billing/formatCurrency'
import { formatDisplayDate, toDateKey } from '../../lib/utils/date'
import { DateRangeFilter, type PeriodPreset } from '../../components/ui/DateRangeFilter'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import type { Bill, PaymentStatus } from '../../types/bill'

const statusTone: Record<PaymentStatus, 'green' | 'amber' | 'red'> = {
  paid: 'green',
  partial: 'amber',
  credit: 'red',
}

function getBillDateKey(bill: Bill): string {
  const ts = bill.createdAt || bill.date
  if (!ts) return ''
  const d = typeof (ts as any).toDate === 'function' ? (ts as any).toDate() : new Date(ts as any)
  return isNaN(d.getTime()) ? '' : toDateKey(d)
}

export function BillsListPage() {
  const t = useT()
  const { bills, loading, hasMore, loadMore, refresh } = useBillsList()
  const { draftCount } = useDraftBills()

  // Filter states
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [preset, setPreset] = useState<PeriodPreset>('all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')

  // Filtered bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // 1. Status Filter
      if (statusFilter !== 'all' && b.paymentStatus !== statusFilter) {
        return false
      }

      // 2. Date Range Filter
      if (startDate && endDate) {
        const k = getBillDateKey(b)
        if (k && (k < startDate || k > endDate)) {
          return false
        }
      }

      // 3. Search Query (Customer name, mobile, bill no)
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const matchName = b.customerName?.toLowerCase().includes(q)
        const matchMobile = b.customerMobile?.includes(q)
        const matchNo = String(b.billNo).includes(q)
        if (!matchName && !matchMobile && !matchNo) {
          return false
        }
      }

      return true
    })
  }, [bills, startDate, endDate, search, statusFilter])

  // Analytics for the selected period & filters
  const analytics = useMemo(() => {
    let totalSalesPaise = 0
    let totalPaidPaise = 0
    let totalDuePaise = 0
    let totalPieces = 0

    for (const b of filteredBills) {
      if (b.status === 'cancelled') continue
      totalSalesPaise += b.netPayableAmountPaise || 0
      totalPaidPaise += b.amountPaidPaise || 0
      totalDuePaise += b.dueAmountPaise || 0
      for (const item of b.items || []) {
        totalPieces += item.qty || 1
      }
    }

    return {
      count: filteredBills.length,
      totalSalesPaise,
      totalPaidPaise,
      totalDuePaise,
      totalPieces,
    }
  }, [filteredBills])

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t('nav.bills')}</h1>
          <p className="text-xs text-slate-400">
            Dukan ki sabhi parchiyan, date range analytics aur payments.
          </p>
        </div>
        <Button variant="secondary" onClick={refresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Date Range Filter Bar */}
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

      {/* Analytics Summary Cards for Selected Period */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Kul Parchi</span>
            <Receipt size={15} className="text-blue-400" />
          </div>
          <p className="mt-1.5 text-lg sm:text-xl font-bold text-slate-900">
            {analytics.count}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {analytics.totalPieces} Piece Bika
          </p>
        </div>

        <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Kul Bikri</span>
            <TrendingUp size={15} className="text-green-400" />
          </div>
          <p className="mt-1.5 text-lg sm:text-xl font-bold text-slate-900">
            {formatPaiseAsRupees(analytics.totalSalesPaise)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Net Payable Amount</p>
        </div>

        <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Jama Rakam</span>
            <Coins size={15} className="text-amber-400" />
          </div>
          <p className="mt-1.5 text-lg sm:text-xl font-bold text-slate-900">
            {formatPaiseAsRupees(analytics.totalPaidPaise)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total Paid Collection</p>
        </div>

        <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Baaki Udhar</span>
            <Clock size={15} className="text-red-400" />
          </div>
          <p className="mt-1.5 text-lg sm:text-xl font-bold text-slate-900">
            {formatPaiseAsRupees(analytics.totalDuePaise)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pending Credit Dues</p>
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Grahak ka naam, mobile ya bill number se khojein..."
            className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          {(['all', 'paid', 'partial', 'credit'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-slate-50 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s === 'all' ? 'Sabhi' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Draft Resume Banner */}
      {draftCount > 0 && (
        <Link
          to="/"
          className="flex animate-fade-in items-center justify-between rounded-xl border border-blue-500/30 bg-blue-950/30 px-4 py-3 text-sm text-blue-200 transition-colors hover:bg-blue-950/50"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <FileClock size={16} />
            </span>
            <div>
              <p className="font-semibold text-blue-100">
                {draftCount} {draftCount === 1 ? 'Pending Draft Bill' : 'Pending Draft Bills'}
              </p>
              <p className="text-xs text-blue-300/80">Kacchi parchi poori karein ya edit karein</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-blue-400">
            <span>Resume</span>
            <ChevronRight size={14} />
          </div>
        </Link>
      )}

      {/* Bills List / Table */}
      {loading && bills.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : filteredBills.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <Inbox size={28} className="text-slate-400" />
          <p className="text-sm font-semibold text-slate-300">
            Is filter me koi bill nahi mila (No bills found for selected period).
          </p>
          {(startDate || statusFilter !== 'all' || search) && (
            <button
              type="button"
              onClick={() => {
                setStartDate(null)
                setEndDate(null)
                setPreset('all')
                setStatusFilter('all')
                setSearch('')
              }}
              className="text-xs text-blue-400 hover:underline mt-1 font-semibold"
            >
              Filter Reset Karein (Show All Bills)
            </button>
          )}
        </Card>
      ) : (
        <Card className="flex flex-col divide-y divide-slate-200 overflow-hidden p-0">
          {filteredBills.map((bill, i) => (
            <Link
              key={bill.id}
              to={`/bills/${bill.id}`}
              style={{ animationDelay: `${Math.min(i * 20, 250)}ms` }}
              className="flex animate-fade-in items-center gap-3 px-4 py-3 [animation-fill-mode:both] transition-colors hover:bg-slate-200/40"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-950/60 text-sm font-bold text-blue-400 border border-blue-500/30">
                {bill.customerName?.[0]?.toUpperCase() ?? '#'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  #{bill.billNo} — {bill.customerName}
                </p>
                <p className="text-xs text-slate-400">
                  {formatDisplayDate(bill.createdAt?.toDate?.() ?? new Date())}
                  {bill.customerMobile && ` · ${bill.customerMobile}`}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {formatPaiseAsRupees(bill.netPayableAmountPaise)}
                  </p>
                  <Badge tone={statusTone[bill.paymentStatus]}>{t(`bill.${bill.paymentStatus}`)}</Badge>
                </div>
                <ChevronRight size={16} className="shrink-0 text-slate-400" />
              </div>
            </Link>
          ))}
        </Card>
      )}

      {/* Pagination Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={loadMore} disabled={loading} className="text-xs font-semibold">
            {loading ? <Spinner className="h-3.5 w-3.5" /> : 'Purani Parchi Load Karein (Load More Bills)'}
          </Button>
        </div>
      )}
    </div>
  )
}
