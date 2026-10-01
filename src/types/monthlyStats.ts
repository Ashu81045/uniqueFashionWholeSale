import type { Timestamp } from 'firebase/firestore'

/**
 * monthlyStats/{YYYY-MM} — same shape as DailyStats, doc id is the month
 * string. Powers month-over-month/year-over-year comparisons via a handful
 * of doc reads instead of reading every daily doc in the range.
 */
export interface MonthlyStats {
  month: string // "2026-07", denormalized copy of the doc id
  totalSalesPaise: number
  cashCollectedPaise: number
  upiCollectedPaise: number
  bankTransferCollectedPaise: number
  otherCollectedPaise: number
  billCount: number
  creditAmountPaise: number
  lastUpdatedAt?: Timestamp
}

/** Zero-value stand-in for a month with no bills yet (doc doesn't exist in Firestore). */
export const emptyMonthlyStats = (month: string): MonthlyStats => ({
  month,
  totalSalesPaise: 0,
  cashCollectedPaise: 0,
  upiCollectedPaise: 0,
  bankTransferCollectedPaise: 0,
  otherCollectedPaise: 0,
  billCount: 0,
  creditAmountPaise: 0,
})
