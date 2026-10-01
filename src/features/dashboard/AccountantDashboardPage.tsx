import { useState, useEffect } from 'react'
import {
  CalendarDays,
  Clock,
  FileCheck2,
  FileText,
  HandCoins,
  Receipt,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { getDoc } from 'firebase/firestore'
import { useT } from '../../i18n/I18nContext'
import { useDateRangeDailyStats } from '../../hooks/useDailyStats'
import { formatPaiseAsRupees } from '../../lib/billing/formatCurrency'
import { todayDateKey } from '../../lib/utils/date'
import { getDayClosureSafe } from '../dayClose/dayCloseService'
import { useAuthStore } from '../../stores/authStore'
import { StatCard } from './components/StatCard'
import { CollectionSplitCard } from './components/CollectionSplitCard'
import { NavTile } from './components/NavTile'
import {
  DateRangeFilterBar,
  type DatePreset,
} from './components/DateRangeFilterBar'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import type { DayClosure } from '../../types/dayClose'

export function AccountantDashboardPage() {
  const t = useT()
  const todayKey = todayDateKey()
  const session = useAuthStore((s) => s.session)
  const userParam = session ? { role: session.role, uid: session.uid } : undefined

  const [startDate, setStartDate] = useState<string>(todayKey)
  const [endDate, setEndDate] = useState<string>(todayKey)
  const [preset, setPreset] = useState<DatePreset>('today')

  const { stats, summary, loading, refresh } = useDateRangeDailyStats(startDate, endDate, userParam)
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
          <p className="text-xs text-slate-400">Rozana bikri, jama, aur gulla hisaab status.</p>
        </div>
        <Button variant="secondary" onClick={refresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label={`${periodLabel} Bikri (Sales)`}
              value={formatPaiseAsRupees(summary.totalSalesPaise)}
              icon={TrendingUp}
              tone="blue"
            />
            <StatCard
              label={`${periodLabel} Parchi (Bills)`}
              value={String(summary.billCount)}
              icon={FileText}
              tone="green"
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

          <CollectionSplitCard
            cashPaise={summary.cashCollectedPaise}
            upiPaise={summary.upiCollectedPaise}
            bankTransferPaise={summary.bankTransferCollectedPaise}
            otherPaise={summary.otherCollectedPaise}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NavTile
              to={`/day-close${isSingleDay ? `/${startDate}` : ''}`}
              label="Gulla Hisaab & Day Close"
              icon={FileCheck2}
            />
            <NavTile to="/collections" label={t('dashboard.collections')} icon={HandCoins} />
          </div>
        </>
      )}
    </div>
  )
}
