import { increment, serverTimestamp, setDoc } from 'firebase/firestore'
import { productSuggestionDocRef } from '../../firebase/firestore'
import { normalizeProductName } from './normalizeProductName'

export interface SoldLineItem {
  name: string
  qty: number
  discountedAmountPaise: number
}

/**
 * Fires after a bill save succeeds — best-effort, non-critical data, never
 * awaited in a way that could fail the bill save. Not reversed on cancel
 * (see productSuggestion.ts for why that's an accepted approximation).
 */
export async function upsertProductSuggestions(items: SoldLineItem[]): Promise<void> {
  const byDocId = new Map<string, { name: string; nameLower: string; qty: number; revenuePaise: number }>()

  for (const item of items) {
    if (!item.name.trim()) continue
    const { docId, nameLower } = normalizeProductName(item.name)
    const existing = byDocId.get(docId)
    if (existing) {
      existing.qty += item.qty
      existing.revenuePaise += item.discountedAmountPaise
    } else {
      byDocId.set(docId, {
        name: item.name.trim(),
        nameLower,
        qty: item.qty,
        revenuePaise: item.discountedAmountPaise,
      })
    }
  }

  const results = await Promise.allSettled(
    Array.from(byDocId.entries()).map(([docId, agg]) =>
      setDoc(
        productSuggestionDocRef(docId),
        {
          name: agg.name,
          nameLower: agg.nameLower,
          useCount: increment(1),
          totalQtySold: increment(agg.qty),
          totalRevenuePaise: increment(agg.revenuePaise),
          lastUsedAt: serverTimestamp(),
        },
        { merge: true },
      ),
    ),
  )

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('Failed to upsert product suggestion (non-critical):', result.reason)
    }
  }
}
