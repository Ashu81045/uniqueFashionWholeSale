import { useCallback, useEffect, useState } from 'react'
import type { QueryDocumentSnapshot } from 'firebase/firestore'
import { fetchBillsPage } from '../features/bills/billsQuery'
import { useAuthStore } from '../stores/authStore'
import type { Bill } from '../types/bill'

export function useBillsList() {
  const session = useAuthStore((s) => s.session)
  const [bills, setBills] = useState<Bill[]>([])
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<Bill> | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadFirstPage = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const page = await fetchBillsPage(session.role, session.uid, null)
      setBills(page.bills)
      setLastDoc(page.lastDoc)
      setHasMore(page.hasMore)
    } finally {
      setLoading(false)
    }
  }, [session])

  const loadMore = useCallback(async () => {
    if (!session || !lastDoc) return
    setLoading(true)
    try {
      const page = await fetchBillsPage(session.role, session.uid, lastDoc)
      setBills((prev) => [...prev, ...page.bills])
      setLastDoc(page.lastDoc)
      setHasMore(page.hasMore)
    } finally {
      setLoading(false)
    }
  }, [session, lastDoc])

  useEffect(() => {
    loadFirstPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.uid])

  return { bills, loading, hasMore, loadMore, refresh: loadFirstPage }
}
