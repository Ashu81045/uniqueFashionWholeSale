import { useCallback, useEffect, useState } from 'react'
import { fetchRecentLedgerFeed, type LedgerFeedEntry } from '../features/ledger/ledgerFeedQuery'
import { useAuthStore } from '../stores/authStore'

export function useLedgerFeed() {
  const session = useAuthStore((s) => s.session)
  const [entries, setEntries] = useState<LedgerFeedEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const feed = await fetchRecentLedgerFeed(session.role, session.uid)
      setEntries(feed)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { entries, loading, refresh }
}
