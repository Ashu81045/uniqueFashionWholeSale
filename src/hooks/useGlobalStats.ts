import { useCallback, useEffect, useState } from 'react'
import { getDoc } from 'firebase/firestore'
import { globalStatsDocRef } from '../firebase/firestore'
import { GLOBAL_STATS_DOC_ID } from '../types/globalStats'

export function useGlobalStats() {
  const [totalOutstandingPaise, setTotalOutstandingPaise] = useState(0)
  const [totalRevenuePaise, setTotalRevenuePaise] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const snap = await getDoc(globalStatsDocRef(GLOBAL_STATS_DOC_ID))
      const data = snap.exists() ? snap.data() : null
      setTotalOutstandingPaise(data?.totalOutstandingPaise ?? 0)
      setTotalRevenuePaise(data?.totalRevenuePaise ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { totalOutstandingPaise, totalRevenuePaise, loading, refresh }
}
