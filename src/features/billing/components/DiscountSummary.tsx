import { Calculator, Percent, RotateCcw } from 'lucide-react'
import { useT } from '../../../i18n/I18nContext'
import { formatPaiseAsRupees, paiseToRupees, rupeesToPaise } from '../../../lib/billing/formatCurrency'
import { numberInputValue, parseNumberInput } from '../../../lib/utils/number'
import { Card } from '../../../components/ui/Card'
import type { BillCalculationResult } from '../../../lib/billing/calculateBill'

export function DiscountSummary({
  calculation,
  overallDiscountPct,
  roundOffPaise,
  onOverallDiscountChange,
  onRoundOffChange,
}: {
  calculation: BillCalculationResult
  overallDiscountPct: number
  roundOffPaise: number
  onOverallDiscountChange: (pct: number) => void
  onRoundOffChange: (paise: number) => void
}) {
  const t = useT()

  // Base pre-round amount in rupees
  const preRoundPaise = calculation.subtotalAfterItemDiscountPaise - calculation.overallDiscountPaise
  const preRoundRupees = Math.round(preRoundPaise / 100)

  // Suggest common rounding options based on the pre-round total
  // E.g., for 3210: nearest 10 is 3210, nearest 50 is 3200 (-10), nearest 100 is 3200 (-10) or 3100 (-110)
  const remainder10 = preRoundRupees % 10
  const remainder50 = preRoundRupees % 50
  const remainder100 = preRoundRupees % 100

  return (
    <Card className="flex flex-col gap-3 p-3">
      {/* Overall Discount Row */}
      <label className="flex items-center justify-between text-sm font-medium text-slate-700">
        <span className="flex items-center gap-1.5">
          <Percent size={14} />
          {t('bill.overallDiscountPct')}
        </span>
        <input
          type="number"
          min={0}
          max={100}
          value={numberInputValue(overallDiscountPct)}
          onChange={(e) => onOverallDiscountChange(parseNumberInput(e.target.value))}
          className="min-h-9 w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-sm transition-shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </label>

      {/* Round Off Row */}
      <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-200/70">
        <div className="flex items-center justify-between text-sm font-medium text-slate-700">
          <span className="flex items-center gap-1.5">
            <Calculator size={14} className="text-blue-600" />
            <span>{t('bill.roundOff') || 'Round Off'}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">₹</span>
            <input
              type="number"
              step="1"
              value={numberInputValue(paiseToRupees(roundOffPaise))}
              onChange={(e) => onRoundOffChange(rupeesToPaise(parseNumberInput(e.target.value)))}
              placeholder="0"
              className="min-h-9 w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-sm font-medium transition-shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        {/* Quick round off suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-400">{t('bill.quickRound') || 'Quick'}:</span>

          {remainder10 !== 0 && (
            <button
              type="button"
              onClick={() => onRoundOffChange(-remainder10 * 100)}
              className="rounded-md bg-white border border-slate-200 px-2 py-1 font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              -₹{remainder10} (to ₹{preRoundRupees - remainder10})
            </button>
          )}

          {remainder50 !== 0 && remainder50 !== remainder10 && (
            <button
              type="button"
              onClick={() => onRoundOffChange(-remainder50 * 100)}
              className="rounded-md bg-white border border-slate-200 px-2 py-1 font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              -₹{remainder50} (to ₹{preRoundRupees - remainder50})
            </button>
          )}

          {remainder100 !== 0 && remainder100 !== remainder50 && remainder100 !== remainder10 && (
            <button
              type="button"
              onClick={() => onRoundOffChange(-remainder100 * 100)}
              className="rounded-md bg-white border border-slate-200 px-2 py-1 font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              -₹{remainder100} (to ₹{preRoundRupees - remainder100})
            </button>
          )}

          {roundOffPaise !== 0 && (
            <button
              type="button"
              onClick={() => onRoundOffChange(0)}
              className="flex items-center gap-1 rounded-md bg-slate-200 px-2 py-1 font-medium text-slate-700 hover:bg-slate-300 transition-colors"
            >
              <RotateCcw size={10} />
              <span>{t('bill.reset') || 'Reset (₹0)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Itemized Calculation Summary */}
      <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-3 text-sm">
        <Row label={t('bill.totalProductAmount')} value={calculation.totalProductAmountPaise} />
        <Row label={t('bill.totalItemDiscount')} value={-calculation.totalItemDiscountPaise} />
        <Row label={t('bill.overallDiscount')} value={-calculation.overallDiscountPaise} />
        {calculation.roundOffPaise !== 0 && (
          <Row
            label={t('bill.roundOff') || 'Round Off'}
            value={calculation.roundOffPaise}
            textColor={calculation.roundOffPaise < 0 ? 'text-amber-700' : 'text-slate-600'}
          />
        )}
        <Row label={t('bill.totalDiscount')} value={-calculation.totalDiscountPaise} />
      </div>

      <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2.5 text-base font-semibold text-blue-900">
        <span>{t('bill.netPayable')}</span>
        <span>{formatPaiseAsRupees(calculation.netPayableAmountPaise)}</span>
      </div>
    </Card>
  )
}

function Row({ label, value, textColor = 'text-slate-600' }: { label: string; value: number; textColor?: string }) {
  return (
    <div className={`flex justify-between ${textColor}`}>
      <span>{label}</span>
      <span>{formatPaiseAsRupees(value)}</span>
    </div>
  )
}
