import type { DraftBill } from '../../types/draftBill'

const DRAFTS_KEY = 'uf_draft_bills'
export const DRAFTS_CHANGED_EVENT = 'uf:drafts_changed'

function safeParse(json: string | null): DraftBill[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getDrafts(): DraftBill[] {
  if (typeof window === 'undefined') return []
  return safeParse(localStorage.getItem(DRAFTS_KEY))
}

export function getDraftById(id: string): DraftBill | null {
  const drafts = getDrafts()
  return drafts.find((d) => d.id === id) ?? null
}

export function saveDraft(
  data: Omit<DraftBill, 'id' | 'draftNo' | 'createdAt' | 'updatedAt'> & { id?: string },
): DraftBill {
  const drafts = getDrafts()
  const now = Date.now()

  if (data.id) {
    const existingIndex = drafts.findIndex((d) => d.id === data.id)
    if (existingIndex >= 0) {
      const updated: DraftBill = {
        ...drafts[existingIndex],
        ...data,
        id: data.id,
        updatedAt: now,
      }
      drafts[existingIndex] = updated
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
      window.dispatchEvent(new CustomEvent(DRAFTS_CHANGED_EVENT))
      return updated
    }
  }

  // Create new draft with incrementing draft number
  const highestDraftNo = drafts.reduce((max, d) => Math.max(max, d.draftNo || 0), 0)
  const newDraft: DraftBill = {
    ...data,
    id: `draft_${now}_${Math.random().toString(36).slice(2, 7)}`,
    draftNo: highestDraftNo + 1,
    createdAt: now,
    updatedAt: now,
  }

  // Add to start of list
  drafts.unshift(newDraft)
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  window.dispatchEvent(new CustomEvent(DRAFTS_CHANGED_EVENT))
  return newDraft
}

export function deleteDraft(id: string): void {
  const drafts = getDrafts()
  const filtered = drafts.filter((d) => d.id !== id)
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered))
  window.dispatchEvent(new CustomEvent(DRAFTS_CHANGED_EVENT))
}

export function clearAllDrafts(): void {
  localStorage.removeItem(DRAFTS_KEY)
  window.dispatchEvent(new CustomEvent(DRAFTS_CHANGED_EVENT))
}
