import { Plus, Sparkles, X } from 'lucide-react'
import { useT } from '../../../i18n/I18nContext'
import { paiseToRupees, rupeesToPaise, formatPaiseAsRupees } from '../../../lib/billing/formatCurrency'
import { numberInputValue, parseNumberInput } from '../../../lib/utils/number'
import { Card } from '../../../components/ui/Card'
import type { BillPaymentModeSplit, PaymentStatus } from '../../../types/bill'
import type { PaymentMode } from '../../../types/payment'

const PAYMENT_MODES: PaymentMode[] = ['cash', 'upi', 'gpay', 'phonepe', 'bank_transfer', 'other']
const PAYMENT_STATUSES: PaymentStatus[] = ['paid', 'partial', 'credit']

function sumSplits(splits: BillPaymentModeSplit[]) {
  return splits.reduce((total, s) => total + s.amountPaise, 0)
}

/**
 * paymentModes is a list of {mode, amountPaise} splits — one row for a single
 * payment mode, multiple rows naturally cover "Mixed Payment" (e.g. part cash,
 * part UPI) without a separate "mixed" enum value.
 */
export function PaymentModeForm({
  netPayableAmountPaise,
  paymentStatus,
  paymentModes,
  roundOffPaise = 0,
  onPaymentStatusChange,
  onPaymentModesChange,
  onRoundOffChange,
}: {
  netPayableAmountPaise: number
  paymentStatus: PaymentStatus
  paymentModes: BillPaymentModeSplit[]
  roundOffPaise?: number
  onPaymentStatusChange: (status: PaymentStatus) => void
  onPaymentModesChange: (modes: BillPaymentModeSplit[]) => void
  onRoundOffChange?: (paise: number) => void
}) {
  const t = useT()
  const amountPaidPaise = sumSplits(paymentModes)
  const dueAmountPaise = netPayableAmountPaise - amountPaidPaise

  function handleStatusChange(status: PaymentStatus) {
    onPaymentStatusChange(status)
    if (status === 'paid') onPaymentModesChange([{ mode: 'cash', amountPaise: netPayableAmountPaise }])
    if (status === 'credit') onPaymentModesChange([])
  }

  function updateSplit(index: number, patch: Partial<BillPaymentModeSplit>) {
    onPaymentModesChange(paymentModes.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function addSplit() {
    onPaymentModesChange([...paymentModes, { mode: 'cash', amountPaise: 0 }])
  }

  function removeSplit(index: number) {
    onPaymentModesChange(paymentModes.filter((_, i) => i !== index))
  }

  function handleRoundOffRemaining() {
    if (!onRoundOffChange || dueAmountPaise <= 0) return
    // Adjust roundOff so netPayable becomes exactly equal to amountPaid
    const newRoundOff = roundOffPaise - dueAmountPaise
    onRoundOffChange(newRoundOff)
    onPaymentStatusChange('paid')
  }

  return (
    <Card className="flex flex-col gap-3 p-3">
      <div className="flex gap-2 rounded-lg bg-slate-200 p-1">
        {PAYMENT_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => handleStatusChange(status)}
            className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-150 ${
              paymentStatus === status
                ? 'bg-blue-600 text-slate-50 shadow-sm'
                : 'text-slate-600 hover:bg-slate-300/60'
            }`}
          >
            {t(`bill.${status}`)}
          </button>
        ))}
      </div>

      {paymentStatus !== 'credit' && (
        <div className="flex flex-col gap-2">
          {paymentModes.map((split, i) => (
            <div key={i} className="flex animate-fade-in items-center gap-2">
              <select
                value={split.mode}
                onChange={(e) => updateSplit(i, { mode: e.target.value as PaymentMode })}
                className="min-h-9 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm transition-shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {t(`bill.paymentMode.${mode}`)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                value={numberInputValue(paiseToRupees(split.amountPaise))}
                onChange={(e) => updateSplit(i, { amountPaise: rupeesToPaise(parseNumberInput(e.target.value)) })}
                className="min-h-9 w-24 rounded-md border border-slate-300 px-2 py-1.5 text-right text-sm transition-shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <button
                type="button"
                onClick={() => removeSplit(i)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-950/50 hover:text-red-400"
                aria-label={t('common.remove')}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSplit}
            className="flex items-center gap-1 self-start text-sm font-medium text-blue-400 hover:underline"
          >
            <Plus size={14} />
            {t('bill.paymentMode')}
          </button>
        </div>
      )}

      {/* Due calculation & 1-click round-off helper */}
      <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-2 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>{t('bill.amountPaid')}</span>
          <span>{formatPaiseAsRupees(amountPaidPaise)}</span>
        </div>
        <div
          className={`flex justify-between font-semibold ${dueAmountPaise > 0 ? 'text-amber-700' : 'text-slate-900'}`}
        >
          <span>{t('bill.due')}</span>
          <span>{formatPaiseAsRupees(dueAmountPaise)}</span>
        </div>

        {/* 1-click round off remaining banner: e.g. Bill is 3210, customer paid 3100, remaining is 110 */}
        {dueAmountPaise > 0 && amountPaidPaise > 0 && onRoundOffChange && (
          <div className="mt-2 flex flex-col gap-2 rounded-lg bg-amber-50/90 border border-amber-200 p-2.5 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
            <div className="text-xs text-amber-900">
              <span className="font-semibold">{t('bill.remainingBalance') || 'Remaining'}: {formatPaiseAsRupees(dueAmountPaise)}</span>
              <p className="text-[11px] text-amber-700">
                {t('bill.roundOffPrompt') || `Customer paid ${formatPaiseAsRupees(amountPaidPaise)}. Round off ${formatPaiseAsRupees(dueAmountPaise)} to settle?`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRoundOffRemaining}
              className="flex items-center justify-center gap-1.5 rounded-md bg-amber-600 hover:bg-amber-700 active:scale-95 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              <Sparkles size={13} />
              <span>{t('bill.roundOffRemaining') || 'Round Off Remaining'} (-{formatPaiseAsRupees(dueAmountPaise)})</span>
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
