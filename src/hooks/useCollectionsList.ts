import { useCallback, useEffect, useState } from 'react'
import { fetchAllPayments } from '../features/collections/collectionsQuery'
import type { CustomerPayment } from '../types/payment'

const PAGE_SIZE = 20

/**
 * `fetchAllPayments` reads the whole collection group in one go (see its
 * doc comment for why), so "pagination" here just reveals more of the
 * already-fetched, already-sorted list — no extra Firestore reads.
 */
export function useCollectionsList() {
  const [allPayments, setAllPayments] = useState<CustomerPayment[]>([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const payments = await fetchAllPayments()
      setAllPayments(payments)
      setVisibleCount(PAGE_SIZE)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(() => {
    setVisibleCount((count) => count + PAGE_SIZE)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    payments: allPayments.slice(0, visibleCount),
    loading,
    hasMore: visibleCount < allPayments.length,
    loadMore,
    refresh,
  }
}
