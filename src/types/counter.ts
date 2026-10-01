import type { Timestamp } from 'firebase/firestore'

/** counters/billCounter — single doc, incremented by 1 per bill inside the save transaction. */
export interface BillCounter {
  currentValue: number
  updatedAt: Timestamp
}

export const BILL_COUNTER_DOC_ID = 'billCounter'
