import { useEffect, useState } from 'react'
import { getDoc } from 'firebase/firestore'
import { monthlyStatsDocRef } from '../firebase/firestore'
import { emptyMonthlyStats } from '../types/monthlyStats'
import { monthKeyOffset } from '../lib/utils/date'

interface PeriodComparison {
  currentPaise: number
  previousPaise: number
}

async function sumMonths(monthOffsets: number[]): Promise<number> {
  const docs = await Promise.all(
    monthOffsets.map(async (offset) => {
      const key = monthKeyOffset(offset)
      const snap = await getDoc(monthlyStatsDocRef(key))
      return snap.exists() ? snap.data() : emptyMonthlyStats(key)
    }),
  )
  return docs.reduce((total, d) => total + d.totalSalesPaise, 0)
}

/**
 * Month-over-month (this month vs last) and year-over-year (year-to-date vs
 * the same months last year) sales comparisons, built from a handful of
 * monthlyStats doc reads rather than summing daily docs.
 */
export function useComparisonStats() {
  const [monthComparison, setMonthComparison] = useState<PeriodComparison | null>(null)
  const [yearComparison, setYearComparison] = useState<PeriodComparison | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const monthsElapsedThisYear = new Date().getMonth() + 1 // 1-12

      const [currentMonth, previousMonth, thisYearSoFar, sameMonthsLastYear] = await Promise.all([
        sumMonths([0]),
        sumMonths([1]),
        sumMonths(Array.from({ length: monthsElapsedThisYear }, (_, i) => i)),
        sumMonths(Array.from({ length: monthsElapsedThisYear }, (_, i) => i + 12)),
      ])

      if (cancelled) return
      setMonthComparison({ currentPaise: currentMonth, previousPaise: previousMonth })
      setYearComparison({ currentPaise: thisYearSoFar, previousPaise: sameMonthsLastYear })
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { monthComparison, yearComparison, loading }
}
