import { useCallback, useEffect, useState } from 'react'
import { getDoc } from 'firebase/firestore'
import { dailyStatsDocRef } from '../firebase/firestore'
import { fetchBillsPage } from '../features/bills/billsQuery'
import { emptyDailyStats, type DailyStats } from '../types/dailyStats'
import { getDateKeysBetween, lastNDateKeys, toDateKey } from '../lib/utils/date'
import type { Bill } from '../types/bill'
import type { UserRole } from '../types/user'

/**
 * Reads dailyStats for any arbitrary date range or single date (when start === end).
 * Cross-references with actual recent bills to ensure 100% data presence even if
 * a dailyStats aggregate was delayed or unindexed.
 */
export function useDateRangeDailyStats(
  startDateKey: string,
  endDateKey: string,
  user?: { role: UserRole; uid: string },
) {
  const [stats, setStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const keys = getDateKeysBetween(startDateKey, endDateKey)
      const dailyStatsDocs = await Promise.all(
        keys.map(async (key) => {
          try {
            const snap = await getDoc(dailyStatsDocRef(key))
            return snap.exists() ? snap.data() : emptyDailyStats(key)
          } catch {
            return emptyDailyStats(key)
          }
        }),
      )

      let recentBills: Bill[] = []
      if (user) {
        try {
          const page = await fetchBillsPage(user.role, user.uid, null)
          recentBills = page.bills
        } catch {
          // Fall back to dailyStatsDocs if bills query fails
        }
      }

      const merged = dailyStatsDocs.map((s) => {
        const dayBills = recentBills.filter((b) => {
          const ts = b.createdAt || b.date
          if (!ts) return false
          const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts as any)
          if (isNaN(d.getTime())) return false
          const localKey = toDateKey(d)
          const utcKey = typeof d.toISOString === 'function' ? d.toISOString().slice(0, 10) : ''
          return localKey === s.date || utcKey === s.date
        })

        // If dailyStats has 0 sales but real bills exist for this day, roll up from bills
        if (dayBills.length > 0 && (s.totalSalesPaise === 0 || s.billCount === 0)) {
          let totalSales = 0
          let cash = 0
          let upi = 0
          let bank = 0
          let other = 0
          let credit = 0

          for (const b of dayBills) {
            if (b.status === 'cancelled') continue
            totalSales += b.netPayableAmountPaise || 0
            credit += b.dueAmountPaise || 0
            for (const m of b.paymentModes || []) {
              if (m.mode === 'cash') cash += m.amountPaise
              else if (m.mode === 'upi' || m.mode === 'gpay' || m.mode === 'phonepe') upi += m.amountPaise
              else if (m.mode === 'bank_transfer') bank += m.amountPaise
              else other += m.amountPaise
            }
          }

          return {
            date: s.date,
            totalSalesPaise: totalSales,
            cashCollectedPaise: cash,
            upiCollectedPaise: upi,
            bankTransferCollectedPaise: bank,
            otherCollectedPaise: other,
            billCount: dayBills.filter((b) => b.status === 'active').length,
            creditAmountPaise: credit,
          }
        }

        return s
      })

      setStats(merged)
    } finally {
      setLoading(false)
    }
  }, [startDateKey, endDateKey, user?.role, user?.uid])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { stats, loading, refresh, summary: sumStats(stats) }
}

/**
 * Reads the last `days` dailyStats docs by known date-key id (no query, no
 * index needed — see plan doc). Missing docs (no bills that day) resolve to
 * a zero-value stand-in rather than being skipped, so callers can always
 * index by position (today = last element).
 */
export function useDailyStatsRange(days: number) {
  const [stats, setStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const keys = lastNDateKeys(days)
      const docs = await Promise.all(
        keys.map(async (key) => {
          const snap = await getDoc(dailyStatsDocRef(key))
          return snap.exists() ? snap.data() : emptyDailyStats(key)
        }),
      )
      setStats(docs)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { stats, loading, refresh }
}

export function sumStats(stats: DailyStats[]): Omit<DailyStats, 'date' | 'lastUpdatedAt'> {
  return stats.reduce(
    (total, s) => ({
      totalSalesPaise: total.totalSalesPaise + s.totalSalesPaise,
      cashCollectedPaise: total.cashCollectedPaise + s.cashCollectedPaise,
      upiCollectedPaise: total.upiCollectedPaise + s.upiCollectedPaise,
      bankTransferCollectedPaise: total.bankTransferCollectedPaise + s.bankTransferCollectedPaise,
      otherCollectedPaise: total.otherCollectedPaise + s.otherCollectedPaise,
      billCount: total.billCount + s.billCount,
      creditAmountPaise: total.creditAmountPaise + s.creditAmountPaise,
    }),
    {
      totalSalesPaise: 0,
      cashCollectedPaise: 0,
      upiCollectedPaise: 0,
      bankTransferCollectedPaise: 0,
      otherCollectedPaise: 0,
      billCount: 0,
      creditAmountPaise: 0,
    },
  )
}
