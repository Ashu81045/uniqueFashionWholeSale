import { getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { productSuggestionsCol } from '../../firebase/firestore'
import type { ProductSuggestion } from '../../types/productSuggestion'

// High-codepoint sentinel used as the exclusive upper bound of a Firestore
// "starts with" range query (the standard prefix-query trick).
const PREFIX_QUERY_SENTINEL = String.fromCharCode(0xf8ff)

export async function queryProductSuggestionsByPrefix(prefix: string): Promise<ProductSuggestion[]> {
  const lower = prefix.trim().toLowerCase()
  if (!lower) return []
  const q = query(
    productSuggestionsCol(),
    where('nameLower', '>=', lower),
    where('nameLower', '<', lower + PREFIX_QUERY_SENTINEL),
    orderBy('nameLower'),
    limit(5),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data())
}

export async function queryTopProducts(limitCount = 5): Promise<ProductSuggestion[]> {
  const q = query(productSuggestionsCol(), orderBy('totalRevenuePaise', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data())
}
