import type { Timestamp } from 'firebase/firestore'

/** dailyStats/{YYYY-MM-DD} — doc id is the date string itself (no query needed). */
export interface DailyStats {
  date: string // "2026-07-30", denormalized copy of the doc id
  totalSalesPaise: number
  cashCollectedPaise: number
  upiCollectedPaise: number // covers UPI + GPay + PhonePe combined for Phase 1
  bankTransferCollectedPaise: number
  otherCollectedPaise: number
  billCount: number
  creditAmountPaise: number
  lastUpdatedAt?: Timestamp
}

/** Zero-value stand-in for a day with no bills yet (doc doesn't exist in Firestore). */
export const emptyDailyStats = (date: string): DailyStats => ({
  date,
  totalSalesPaise: 0,
  cashCollectedPaise: 0,
  upiCollectedPaise: 0,
  bankTransferCollectedPaise: 0,
  otherCollectedPaise: 0,
  billCount: 0,
  creditAmountPaise: 0,
})
