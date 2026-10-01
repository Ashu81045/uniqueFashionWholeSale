import type { Timestamp } from 'firebase/firestore'

/**
 * productSuggestions/{normalizedName} — doc id is the lowercased/slugified
 * product name, for idempotent upsert. Powers both the line-item name
 * autocomplete (prefix query on nameLower) and "Top Selling Products"
 * (order by totalRevenuePaise). Best-effort/eventually-consistent — not
 * reversed when a bill is cancelled.
 */
export interface ProductSuggestion {
  name: string
  nameLower: string
  useCount: number
  totalQtySold: number
  totalRevenuePaise: number
  lastUsedAt?: Timestamp
}
