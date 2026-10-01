import type { Timestamp } from 'firebase/firestore'

/**
 * globalStats/outstanding — single doc tracking the sum of every customer's
 * outstandingBalancePaise. Kept in sync via increment() wherever a customer's
 * balance changes (bill create/cancel/edit, payment recorded), so the admin
 * dashboard's "Outstanding Amount" is a single doc read instead of summing
 * every customer doc (which would grow unboundedly expensive).
 */
export interface GlobalStats {
  totalOutstandingPaise: number
  /** Cumulative lifetime net sales, incremented on every active bill (reversed on cancel). */
  totalRevenuePaise: number
  lastUpdatedAt?: Timestamp
}

export const GLOBAL_STATS_DOC_ID = 'outstanding'
