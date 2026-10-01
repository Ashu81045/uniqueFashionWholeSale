import { useEffect, useState } from 'react'
import {
  getDrafts,
  deleteDraft,
  clearAllDrafts,
  DRAFTS_CHANGED_EVENT,
} from '../lib/drafts/draftStorage'
import type { DraftBill } from '../types/draftBill'

export function useDraftBills() {
  const [drafts, setDrafts] = useState<DraftBill[]>(() => getDrafts())

  useEffect(() => {
    function handleUpdate() {
      setDrafts(getDrafts())
    }

    window.addEventListener(DRAFTS_CHANGED_EVENT, handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener(DRAFTS_CHANGED_EVENT, handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  return {
    drafts,
    draftCount: drafts.length,
    deleteDraft,
    clearAllDrafts,
  }
}
