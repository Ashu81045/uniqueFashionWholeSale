import { useState } from 'react'
import {
  Clock,
  FileText,
  Trash2,
  ArrowRight,
  Search,
  AlertCircle,
  ShoppingBag,
  User as UserIcon,
  Phone,
  CheckCircle,
} from 'lucide-react'
import { useT } from '../../../i18n/I18nContext'
import { formatPaiseAsRupees } from '../../../lib/billing/formatCurrency'
import { formatDisplayDate } from '../../../lib/utils/date'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import type { DraftBill } from '../../../types/draftBill'

export function DraftsModal({
  drafts,
  activeDraftId,
  onSelectDraft,
  onDeleteDraft,
  onClearAllDrafts,
  onClose,
}: {
  drafts: DraftBill[]
  activeDraftId: string | null
  onSelectDraft: (draft: DraftBill) => void
  onDeleteDraft: (id: string) => void
  onClearAllDrafts?: () => void
  onClose: () => void
}) {
  const t = useT()
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)

  const filteredDrafts = drafts.filter((d) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const draftNoMatch = `draft #${d.draftNo}`.toLowerCase().includes(q) || String(d.draftNo).includes(q)
    const customerMatch =
      d.customerName?.toLowerCase().includes(q) ||
      d.customerMobile?.includes(q) ||
      d.customer?.name?.toLowerCase().includes(q) ||
      d.customer?.mobile?.includes(q)
    const itemMatch = d.items?.some((i) => i.name.toLowerCase().includes(q))
    return draftNoMatch || customerMatch || itemMatch
  })

  return (
    <Modal
      title={t('bill.draftsTitle') || 'Saved Draft Bills'}
      onClose={onClose}
      size="2xl"
    >
      <div className="flex flex-col gap-4">
        {/* Subtitle and Search bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {t('bill.draftsDesc') ||
              'Pending bills saved automatically or held for customers. Select any draft to resume.'}
          </p>

          {drafts.length > 2 && (
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drafts, items, customer..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Empty state */}
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200/60 text-blue-400 shadow-inner">
              <FileText size={28} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              {t('bill.noDrafts') || 'No Saved Drafts'}
            </p>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              {t('bill.noDraftsHint') ||
                'Bills you create are automatically saved in the background. You can also click "Save as Draft" to hold a bill for later.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="mt-5 text-xs"
            >
              Back to Billing
            </Button>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle size={24} className="text-slate-400" />
            <p className="mt-2 text-xs font-medium text-slate-300">
              No drafts matching &ldquo;{searchQuery}&rdquo;
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs text-blue-400"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
            {filteredDrafts.map((draft) => {
              const isCurrent = draft.id === activeDraftId
              const validItems = draft.items.filter((i) => i.name.trim())
              const isConfirmingDelete = confirmDeleteId === draft.id

              return (
                <div
                  key={draft.id}
                  className={`group relative flex flex-col justify-between gap-3.5 rounded-xl border p-4 transition-all ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-950/40 shadow-md ring-1 ring-blue-500/40'
                      : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {/* Top row: Draft Header, badges, and timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        Draft #{draft.draftNo}
                      </span>
                      {isCurrent && (
                        <Badge tone="blue">
                          {t('bill.currentlyEditing') || 'Currently Active'}
                        </Badge>
                      )}
                      {draft.isAutoSave && (
                        <Badge tone="amber">
                          {t('bill.autoSaved') || 'Auto-Saved'}
                        </Badge>
                      )}
                    </div>

                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={12} className="text-slate-400" />
                      {formatDisplayDate(new Date(draft.updatedAt))}
                    </span>
                  </div>

                  {/* Middle row: Customer info & Items summary */}
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {/* Customer */}
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-blue-400">
                        <UserIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900">
                          {draft.customerName ||
                            (draft.customer ? draft.customer.name : 'Walk-in Customer')}
                        </p>
                        {draft.customerMobile ? (
                          <p className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Phone size={10} className="text-slate-400" />
                            {draft.customerMobile}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">No mobile provided</p>
                        )}
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-blue-400">
                        <ShoppingBag size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-300">
                          {validItems.length} {validItems.length === 1 ? 'line item' : 'line items'}
                        </p>
                        {validItems.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {validItems.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-block max-w-[130px] truncate rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700"
                                title={`${item.name} (Qty ${item.qty})`}
                              >
                                {item.name} ×{item.qty}
                              </span>
                            ))}
                            {validItems.length > 3 && (
                              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                                +{validItems.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">No items entered yet</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom row: Pricing calculation & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/80 pt-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-medium text-slate-400">
                        {t('bill.netPayable') || 'Net Payable'}:
                      </span>
                      <span className="text-base font-bold text-slate-900">
                        {formatPaiseAsRupees(draft.netPayableAmountPaise)}
                      </span>
                      {draft.overallDiscountPct > 0 && (
                        <span className="text-[11px] font-semibold text-green-400">
                          ({draft.overallDiscountPct}% off)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5 animate-fade-in">
                          <span className="text-[11px] font-medium text-red-400">Delete draft?</span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              onDeleteDraft(draft.id)
                              setConfirmDeleteId(null)
                            }}
                            className="h-7 px-2 text-xs bg-red-600 text-white hover:bg-red-500 border-transparent"
                          >
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-7 px-2 text-xs text-slate-400 hover:bg-slate-200"
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(draft.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-950/40 hover:text-red-400"
                          title="Delete draft"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}

                      <Button
                        size="sm"
                        variant={isCurrent ? 'secondary' : 'primary'}
                        onClick={() => {
                          onSelectDraft(draft)
                          onClose()
                        }}
                        className={`flex items-center gap-1.5 text-xs font-semibold ${
                          isCurrent
                            ? 'border-blue-400/40 text-blue-300 hover:bg-blue-900/30'
                            : ''
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <CheckCircle size={14} className="text-blue-400" />
                            <span>Continue Editing</span>
                          </>
                        ) : (
                          <>
                            <span>Resume Draft</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer controls */}
        {drafts.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <div>
              {onClearAllDrafts && (
                confirmClearAll ? (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <span className="text-xs text-red-400 font-medium">Clear all drafts?</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        onClearAllDrafts()
                        setConfirmClearAll(false)
                        onClose()
                      }}
                      className="h-7 px-2.5 text-xs bg-red-600 text-white hover:bg-red-500 border-transparent"
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmClearAll(false)}
                      className="h-7 px-2 text-xs text-slate-400 hover:bg-slate-200"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmClearAll(true)}
                    className="text-xs text-slate-400 hover:text-red-400 hover:bg-red-950/30"
                  >
                    Clear All Drafts
                  </Button>
                )
              )}
            </div>

            <Button variant="secondary" size="sm" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
