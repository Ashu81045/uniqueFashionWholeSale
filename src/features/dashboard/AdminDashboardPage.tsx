import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  Clock,
  FileCheck2,
  FileText,
  HandCoins,
  Package,
  Receipt,
  RefreshCw,
  Settings,
  Sparkles,
  TrendingUp,
  UserCog,
  Users2,
  Wallet,
} from 'lucide-react'
import { getDoc } from 'firebase/firestore'
import { useT } from '../../i18n/I18nContext'
import { useDateRangeDailyStats } from '../../hooks/useDailyStats'
import { useGlobalStats } from '../../hooks/useGlobalStats'
import { useComparisonStats } from '../../hooks/useComparisonStats'
import { useTopLists } from '../../hooks/useTopLists'
import { formatPaiseAsRupees } from '../../lib/billing/formatCurrency'
import { todayDateKey } from '../../lib/utils/date'
import { getDayClosureSafe } from '../dayClose/dayCloseService'
import { useAuthStore } from '../../stores/authStore'
import { StatCard } from './components/StatCard'
import { CollectionSplitCard } from './components/CollectionSplitCard'
import { SalesTrendChart } from './components/SalesTrendChart'
import { ComparisonCard } from './components/ComparisonCard'
import { TopList } from './components/TopList'
import { NavTile } from './components/NavTile'
import {
  DateRangeFilterBar,
  type DatePreset,
} from './components/DateRangeFilterBar'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import type { DayClosure } from '../../types/dayClose'

export function AdminDashboardPage() {
  const t = useT()
  const todayKey = todayDateKey()
  const session = useAuthStore((s) => s.session)
  const userParam = session ? { role: session.role, uid: session.uid } : undefined

  // Date filter state (defaults to Today)
  const [startDate, setStartDate] = useState<string>(todayKey)
  const [endDate, setEndDate] = useState<string>(todayKey)
  const [preset, setPreset] = useState<DatePreset>('today')

  const { stats, summary, loading, refresh } = useDateRangeDailyStats(startDate, endDate, userParam)
  const {
    totalOutstandingPaise,
    totalRevenuePaise,
    loading: outstandingLoading,
    refresh: refreshOutstanding,
  } = useGlobalStats()
  const { monthComparison, yearComparison } = useComparisonStats()
  const { topCustomers, topProducts } = useTopLists()

  // Day closure doc state for single-date view
  const [dayClosure, setDayClosure] = useState<DayClosure | null>(null)

  useEffect(() => {
    let active = true
    if (startDate === endDate) {
      getDayClosureSafe(startDate).then((closure) => {
        if (active) setDayClosure(closure)
      })
    } else {
      setDayClosure(null)
    }
    return () => {
      active = false
    }
  }, [startDate, endDate])

  function refreshAll() {
    refresh()
    refreshOutstanding()
  }

  // Average order value for selected range
  const aovPaise =
    summary.billCount > 0 ? Math.round(summary.totalSalesPaise / summary.billCount) : 0

  const isSingleDay = startDate === endDate
  const periodLabel = isSingleDay ? 'Chuni Tareekh' : 'Chuna Samay'

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t('dashboard.title')}</h1>
          <p className="text-xs text-slate-400">
            Bikri, Gulla Hisaab aur Rozana Munafa Analytics.
          </p>
        </div>
        <Button variant="secondary" onClick={refreshAll} disabled={loading || outstandingLoading}>
          <RefreshCw size={14} className={loading || outstandingLoading ? 'animate-spin' : ''} />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Date Filter Bar */}
      <DateRangeFilterBar
        startDate={startDate}
        endDate={endDate}
        onChange={(s, e, p) => {
          setStartDate(s)
          setEndDate(e)
          setPreset(p)
        }}
        currentPreset={preset}
        dayClosure={dayClosure}
      />

      {loading && stats.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Row 1: Filtered Dynamic Period Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label={`${periodLabel} Bikri (Sales)`}
              value={formatPaiseAsRupees(summary.totalSalesPaise)}
              icon={TrendingUp}
              tone="green"
            />
            <StatCard
              label={`${periodLabel} Parchi (Bills)`}
              value={String(summary.billCount)}
              icon={FileText}
              tone="blue"
            />
            <StatCard
              label="Aurat Parchi (AOV)"
              value={formatPaiseAsRupees(aovPaise)}
              icon={Receipt}
              tone="amber"
            />
            <StatCard
              label="Naya Udhar (Credit)"
              value={formatPaiseAsRupees(summary.creditAmountPaise)}
              icon={Clock}
              tone="red"
            />
          </div>

          {/* Row 2: All-Time Store Totals & Day Close Status */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Kul Karobar (All-Time)"
              value={formatPaiseAsRupees(totalRevenuePaise)}
              icon={Sparkles}
              tone="blue"
            />
            <StatCard
              label="Bazaar Udhar (Customer Dues)"
              value={formatPaiseAsRupees(totalOutstandingPaise)}
              icon={AlertTriangle}
              tone="red"
            />
            <StatCard
              label="Kul Jama (Cash + UPI)"
              value={formatPaiseAsRupees(
                summary.cashCollectedPaise +
                  summary.upiCollectedPaise +
                  summary.bankTransferCollectedPaise +
                  summary.otherCollectedPaise,
              )}
              icon={Wallet}
              tone="green"
            />
            <StatCard
              label="Gulla Status"
              value={
                isSingleDay
                  ? dayClosure?.status === 'closed'
                    ? 'Gulla Band ✓'
                    : 'Gulla Chalu'
                  : 'Multi-Day View'
              }
              icon={FileCheck2}
              tone={isSingleDay && dayClosure?.status === 'closed' ? 'green' : 'amber'}
            />
          </div>

          {/* Dynamic Sales Trend Chart for Selected Dates */}
          <SalesTrendChart stats={stats} />

          {/* Dynamic Collection Split Card for Selected Dates */}
          <CollectionSplitCard
            cashPaise={summary.cashCollectedPaise}
            upiPaise={summary.upiCollectedPaise}
            bankTransferPaise={summary.bankTransferCollectedPaise}
            otherPaise={summary.otherCollectedPaise}
          />

          {monthComparison && yearComparison && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ComparisonCard
                label={t('dashboard.monthComparison')}
                currentPaise={monthComparison.currentPaise}
                previousPaise={monthComparison.previousPaise}
              />
              <ComparisonCard
                label={t('dashboard.yearComparison')}
                currentPaise={yearComparison.currentPaise}
                previousPaise={yearComparison.previousPaise}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TopList title={t('dashboard.topCustomers')} icon={Users2} rows={topCustomers} />
            <TopList title={t('dashboard.topProducts')} icon={Package} rows={topProducts} />
          </div>

          {/* Quick Nav Tiles */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <NavTile
              to={`/day-close${isSingleDay ? `/${startDate}` : ''}`}
              label="Gulla Hisaab & Day Close"
              icon={FileCheck2}
            />
            <NavTile to="/collections" label={t('dashboard.collections')} icon={HandCoins} />
            {/* TopNav already shows these on desktop — surface them here too for mobile. */}
            <div className="sm:hidden">
              <NavTile to="/settings" label={t('nav.settings')} icon={Settings} />
            </div>
            <div className="sm:hidden">
              <NavTile to="/users" label={t('nav.users')} icon={UserCog} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
