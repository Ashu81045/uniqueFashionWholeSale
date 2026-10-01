import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  BookmarkPlus,
  Check,
  CheckCircle2,
  Eye,
  FileClock,
  History,
  ListPlus,
  ReceiptText,
  RotateCcw,
} from 'lucide-react'
import { useT } from '../../i18n/I18nContext'
import { useAuthStore } from '../../stores/authStore'
import { calculateBill, type BillLineItemInput } from '../../lib/billing/calculateBill'
import { useDraftBills } from '../../hooks/useDraftBills'
import { saveDraft } from '../../lib/drafts/draftStorage'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'
import { BillHeaderForm } from './components/BillHeaderForm'
import { LineItemsTable } from './components/LineItemsTable'
import { DiscountSummary } from './components/DiscountSummary'
import { PaymentModeForm } from './components/PaymentModeForm'
import { BillPreview, type BillPreviewData } from './components/BillPreview'
import { DraftsModal } from './components/DraftsModal'
import { saveBill } from './billService'
import type { Customer } from '../../types/customer'
import type { BillPaymentModeSplit, PaymentStatus } from '../../types/bill'
import type { DraftBill } from '../../types/draftBill'

export function NewBillPage() {
  const t = useT()
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const { drafts, draftCount, deleteDraft, clearAllDrafts } = useDraftBills()

  const [activeDraftId, setActiveDraftId] = useState<string | null>(null)
  const [activeDraftNo, setActiveDraftNo] = useState<number | null>(null)
  const [showDraftsModal, setShowDraftsModal] = useState(false)
  const [draftNotice, setDraftNotice] = useState<string | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Keep a stable ref to activeDraftId across async auto-save debounce timers
  const activeDraftIdRef = useRef<string | null>(null)
  activeDraftIdRef.current = activeDraftId

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<BillLineItemInput[]>([
    { name: '', qty: 1, ratePaise: 0, itemDiscountPct: 0 },
  ])
  const [overallDiscountPct, setOverallDiscountPct] = useState(0)
  const [roundOffPaise, setRoundOffPaise] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid')
  const [paymentModes, setPaymentModes] = useState<BillPaymentModeSplit[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const calculation = calculateBill(items, overallDiscountPct, roundOffPaise)

  // Keep the "paid in full" split amount in sync as line items/discounts/round-off change.
  useEffect(() => {
    if (paymentStatus === 'paid') {
      setPaymentModes((modes) =>
        modes.length === 1
          ? [{ ...modes[0], amountPaise: calculation.netPayableAmountPaise }]
          : [{ mode: 'cash', amountPaise: calculation.netPayableAmountPaise }],
      )
    }
  }, [calculation.netPayableAmountPaise, paymentStatus])

  const validItems = items.filter((i) => i.name.trim() && i.qty > 0 && i.ratePaise > 0)
  const canFinalize = Boolean(customer && validItems.length > 0 && session && !saving)
  const canDraft = Boolean((customer || validItems.length > 0) && !saving)

  const hasBillContent = Boolean(
    customer !== null ||
    items.some((i) => i.name.trim().length > 0 || (i.ratePaise && i.ratePaise > 0)) ||
    overallDiscountPct > 0 ||
    roundOffPaise !== 0
  )

  // Automatic Background Draft Saving: Debounced save whenever active bill changes
  useEffect(() => {
    if (!hasBillContent || saving) return

    setAutoSaveStatus('saving')
    const timer = setTimeout(() => {
      const draft = saveDraft({
        id: activeDraftIdRef.current ?? undefined,
        customer,
        items,
        overallDiscountPct,
        roundOffPaise,
        paymentStatus,
        paymentModes,
        customerName: customer?.name || 'Walk-in Customer',
        customerMobile: customer?.mobile || '',
        itemCount: items.filter((i) => i.name.trim() && i.qty > 0 && i.ratePaise > 0).length,
        netPayableAmountPaise: calculation.netPayableAmountPaise,
        isAutoSave: true,
      })

      activeDraftIdRef.current = draft.id
      setActiveDraftId(draft.id)
      setActiveDraftNo(draft.draftNo)
      setAutoSaveStatus('saved')
    }, 800)

    return () => clearTimeout(timer)
  }, [
    customer,
    items,
    overallDiscountPct,
    roundOffPaise,
    paymentStatus,
    paymentModes,
    calculation.netPayableAmountPaise,
    hasBillContent,
    saving,
  ])

  function handleResetForm() {
    activeDraftIdRef.current = null
    setActiveDraftId(null)
    setActiveDraftNo(null)
    setCustomer(null)
    setItems([{ name: '', qty: 1, ratePaise: 0, itemDiscountPct: 0 }])
    setOverallDiscountPct(0)
    setRoundOffPaise(0)
    setPaymentStatus('paid')
    setPaymentModes([])
    setAutoSaveStatus('idle')
    setError(null)
  }

  function handleSaveDraft() {
    if (!canDraft) return
    const draft = saveDraft({
      id: activeDraftIdRef.current ?? undefined,
      customer,
      items,
      overallDiscountPct,
      roundOffPaise,
      paymentStatus,
      paymentModes,
      customerName: customer?.name || 'Walk-in Customer',
      customerMobile: customer?.mobile || '',
      itemCount: validItems.length,
      netPayableAmountPaise: calculation.netPayableAmountPaise,
      isAutoSave: false,
    })

    // Automatically reset the current bill screen immediately — no need to click New Bill
    handleResetForm()
    setDraftNotice(`Draft #${draft.draftNo} saved! Bill screen reset for next bill.`)
    setTimeout(() => setDraftNotice(null), 4000)
  }

  function handleSelectDraft(draft: DraftBill) {
    activeDraftIdRef.current = draft.id
    setActiveDraftId(draft.id)
    setActiveDraftNo(draft.draftNo)
    setCustomer(draft.customer)
    setItems(draft.items.length > 0 ? draft.items : [{ name: '', qty: 1, ratePaise: 0, itemDiscountPct: 0 }])
    setOverallDiscountPct(draft.overallDiscountPct ?? 0)
    setRoundOffPaise(draft.roundOffPaise ?? 0)
    setPaymentStatus(draft.paymentStatus ?? 'paid')
    setPaymentModes(draft.paymentModes ?? [])
    setAutoSaveStatus('saved')
    setDraftNotice(`Resumed Draft #${draft.draftNo}`)
    setTimeout(() => setDraftNotice(null), 3000)
  }

  async function handleSave() {
    if (!customer || !session) return
    setSaving(true)
    setError(null)
    try {
      const bill = await saveBill({
        items: validItems,
        overallDiscountPct,
        roundOffPaise,
        customerId: customer.mobile,
        customerName: customer.name,
        customerMobile: customer.mobile,
        paymentStatus,
        paymentModes,
        createdByUid: session.uid,
        createdByRole: session.role,
      })

      // Clean up the draft if this bill was resumed or auto-saved
      if (activeDraftIdRef.current) {
        deleteDraft(activeDraftIdRef.current)
      }

      navigate(`/bills/${bill.id}`)
    } catch {
      setError('Failed to save bill. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const previewData: BillPreviewData = {
    billNo: activeDraftNo ? `draft #${activeDraftNo}` as unknown as 'draft' : 'draft',
    date: new Date(),
    customerName: customer?.name ?? '—',
    customerMobile: customer?.mobile ?? '—',
    items: calculation.items,
    totalProductAmountPaise: calculation.totalProductAmountPaise,
    totalItemDiscountPaise: calculation.totalItemDiscountPaise,
    overallDiscountPct: calculation.overallDiscountPct,
    overallDiscountPaise: calculation.overallDiscountPaise,
    roundOffPaise: calculation.roundOffPaise,
    totalDiscountPaise: calculation.totalDiscountPaise,
    netPayableAmountPaise: calculation.netPayableAmountPaise,
    paymentStatus,
    amountPaidPaise: paymentModes.reduce((total, s) => total + s.amountPaise, 0),
    dueAmountPaise:
      calculation.netPayableAmountPaise - paymentModes.reduce((total, s) => total + s.amountPaise, 0),
    paymentModes,
  }

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        {/* Header Bar with Draft Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ReceiptText size={20} className="text-blue-600" />
              {activeDraftNo ? `${t('bill.draft') || 'Draft'} #${activeDraftNo}` : t('bill.create')}
            </h1>
            {activeDraftNo && (
              <Badge tone="blue">{t('bill.draftBadge') || 'Draft'}</Badge>
            )}
            {autoSaveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-blue-500" />
                <span>Auto-saving...</span>
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 animate-fade-in">
                <Check size={14} className="text-emerald-600" />
                <span>Auto-saved</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Drafts list button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDraftsModal(true)}
              className="relative flex items-center gap-1.5"
            >
              <FileClock size={15} />
              <span>{t('bill.drafts') || 'Drafts'}</span>
              {draftCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white shadow-xs">
                  {draftCount}
                </span>
              )}
            </Button>

            {/* Clear / New bill button if modified */}
            {(activeDraftId || customer || validItems.length > 0) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetForm}
                className="flex items-center gap-1 text-slate-600"
                title="Reset form"
              >
                <RotateCcw size={14} />
                <span>{t('bill.newBill') || 'New'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Unsaved in-progress drafts recovery prompt if current form is blank */}
        {drafts.length > 0 && !activeDraftId && !hasBillContent && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-200 shadow-sm shadow-black/20">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-900/50 text-amber-400">
                <History size={16} />
              </div>
              <div>
                <p className="font-semibold text-amber-100">
                  Unsaved draft available ({drafts.length} saved)
                </p>
                <p className="text-amber-300/80">
                  Draft #{drafts[0].draftNo} • {drafts[0].customerName || 'Walk-in'} •{' '}
                  {drafts[0].items.filter((i) => i.name.trim()).length} item(s)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleSelectDraft(drafts[0])}
                className="h-8 text-xs shadow-xs"
              >
                Resume Draft
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowDraftsModal(true)}
                className="h-8 text-xs"
              >
                View All
              </Button>
            </div>
          </div>
        )}

        {/* Temporary Draft Notice */}
        {draftNotice && (
          <div className="flex animate-fade-in items-center gap-2 rounded-lg bg-blue-950/50 border border-blue-500/40 px-3 py-2 text-xs font-medium text-blue-200">
            <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
            <span>{draftNotice}</span>
          </div>
        )}

        <BillHeaderForm
          selectedCustomer={customer}
          onCustomerSelect={setCustomer}
        />

        <Card className="p-3">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <ListPlus size={16} />
            {t('bill.lineItems')}
          </h2>
          <LineItemsTable items={items} onChange={setItems} />
        </Card>

        <DiscountSummary
          calculation={calculation}
          overallDiscountPct={overallDiscountPct}
          roundOffPaise={roundOffPaise}
          onOverallDiscountChange={setOverallDiscountPct}
          onRoundOffChange={setRoundOffPaise}
        />

        <PaymentModeForm
          netPayableAmountPaise={calculation.netPayableAmountPaise}
          paymentStatus={paymentStatus}
          paymentModes={paymentModes}
          roundOffPaise={roundOffPaise}
          onPaymentStatusChange={setPaymentStatus}
          onPaymentModesChange={setPaymentModes}
          onRoundOffChange={setRoundOffPaise}
        />

        {error && (
          <div className="flex animate-fade-in items-center gap-2 rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={!canDraft}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-1.5 border-slate-300 hover:bg-slate-100"
          >
            <BookmarkPlus size={16} className="text-slate-600" />
            <span>{activeDraftId ? (t('bill.updateDraft') || 'Update Draft') : (t('bill.saveDraft') || 'Save as Draft')}</span>
          </Button>

          <Button
            onClick={handleSave}
            disabled={!canFinalize}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-1.5 shadow-md"
          >
            {saving ? <Spinner tone="dark" /> : (t('bill.finalizeAndSave') || t('common.save'))}
          </Button>
        </div>
      </div>

      {/* Desktop: live sticky preview */}
      <div className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">{t('bill.preview')}</h2>
        <BillPreview data={previewData} />
      </div>

      {/* Mobile Floating Preview Button */}
      <button
        type="button"
        onClick={() => setShowPreview(true)}
        className="no-print fixed bottom-24 right-4 z-10 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-slate-50 shadow-lg shadow-black/40 transition-all duration-150 hover:scale-105 hover:bg-blue-500 active:scale-95 lg:hidden"
      >
        <Eye size={18} />
        {t('bill.preview')}
      </button>

      {/* Mobile Preview Modal */}
      {showPreview && (
        <Modal title={t('bill.preview')} onClose={() => setShowPreview(false)} size="lg">
          <BillPreview data={previewData} />
        </Modal>
      )}

      {/* Drafts Modal */}
      {showDraftsModal && (
        <DraftsModal
          drafts={drafts}
          activeDraftId={activeDraftId}
          onSelectDraft={handleSelectDraft}
          onDeleteDraft={(id) => {
            deleteDraft(id)
            if (activeDraftIdRef.current === id) {
              handleResetForm()
            }
          }}
          onClearAllDrafts={() => {
            clearAllDrafts()
            handleResetForm()
          }}
          onClose={() => setShowDraftsModal(false)}
        />
      )}
    </div>
  )
}
