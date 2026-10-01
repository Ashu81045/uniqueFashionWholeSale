import { useCallback, useEffect, useState } from 'react'
import type { QueryDocumentSnapshot } from 'firebase/firestore'
import { fetchCustomersPage } from '../features/customers/customersQuery'
import type { Customer } from '../types/customer'

export function useCustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<Customer> | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadFirstPage = useCallback(async () => {
    setLoading(true)
    try {
      const page = await fetchCustomersPage(null)
      setCustomers(page.customers)
      setLastDoc(page.lastDoc)
      setHasMore(page.hasMore)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (!lastDoc) return
    setLoading(true)
    try {
      const page = await fetchCustomersPage(lastDoc)
      setCustomers((prev) => [...prev, ...page.customers])
      setLastDoc(page.lastDoc)
      setHasMore(page.hasMore)
    } finally {
      setLoading(false)
    }
  }, [lastDoc])

  useEffect(() => {
    loadFirstPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { customers, loading, hasMore, loadMore, refresh: loadFirstPage }
}
