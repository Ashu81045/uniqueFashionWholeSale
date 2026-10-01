import type { Timestamp } from 'firebase/firestore'

/** customers/{mobileNumber} — doc id IS the mobile number, for single-getDoc lookup. */
export interface Customer {
  mobile: string
  name: string
  outstandingBalancePaise: number
  /**
   * Cumulative net-payable across all bills regardless of payment status —
   * powers "Top Customers". Missing on customer docs created before this
   * field existed; Firestore excludes those from orderBy('totalSpentPaise')
   * queries until their next bill sets it (no backfill needed/attempted).
   */
  totalSpentPaise: number
  billCount: number
  lastBillNo: number | null
  lastBillAt: Timestamp | null
  createdByUid: string
  createdAt: Timestamp
}
