import { useT } from '../../../i18n/I18nContext'
import { formatPaiseAsRupees } from '../../../lib/billing/formatCurrency'
import { formatDisplayDate } from '../../../lib/utils/date'
import type { BillLineItemComputed } from '../../../lib/billing/calculateBill'
import type { BillPaymentModeSplit, PaymentStatus } from '../../../types/bill'

export interface BillPreviewData {
  billNo: number | 'draft'
  date: Date
  customerName: string
  customerMobile: string
  items: BillLineItemComputed[]
  totalProductAmountPaise: number
  totalItemDiscountPaise: number
  overallDiscountPct: number
  overallDiscountPaise: number
  roundOffPaise?: number
  totalDiscountPaise: number
  netPayableAmountPaise: number
  paymentStatus: PaymentStatus
  amountPaidPaise: number
  dueAmountPaise: number
  paymentModes: BillPaymentModeSplit[]
  customerAddress?: string
}

/**
 * Classic Indian wholesale "kacchi bill" layout: line items, then
 * Total Product Amount -> Overall Discount -> Additional Item Discounts ->
 * Total Discount -> Net Amount Payable, in that exact order. Shared by the
 * on-screen preview, thermal/A4 print layouts, and PDF/WhatsApp share.
 *
 * The desktop item grid intentionally uses CSS Grid, not <table>/<colgroup>.
 * Native table column-width hints (via <col>) are unreliable across browser
 * print engines and html2canvas (used for PDF export) alike — columns can
 * end up colliding instead of respecting their assigned widths.
 * `grid-template-columns` renders consistently everywhere this data ends up.
 */
const ITEM_GRID_COLS = 'grid-cols-[3.8fr_1.6fr_1fr_1.6fr_2fr]'

export function BillPreview({ data }: { data: BillPreviewData }) {
  const t = useT()

  return (
    <div className="animate-fade-in rounded-xl border border-slate-200 bg-slate-100 p-4 text-sm shadow-sm shadow-black/20">
      <div className="mb-3 flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
        <div>
          <p className="font-semibold text-slate-900">{t('app.name')}</p>
          <p className="text-slate-500">
            {t('bill.number')}: {data.billNo === 'draft' ? '—' : data.billNo}
          </p>
        </div>
        <div className="text-right text-slate-500">
          <p>{formatDisplayDate(data.date)}</p>
        </div>
      </div>

      <div className="mb-3 border-b border-dashed border-slate-300 pb-2">
        <p className="font-medium text-slate-900">{data.customerName}</p>
        <p className="text-slate-500">{data.customerMobile}</p>
      </div>

      {/* Mobile: stacked rows (no horizontal scroll). Desktop/tablet: grid "table". */}
      <div className="flex flex-col divide-y divide-slate-200 sm:hidden">
        {data.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-2 py-1.5">
            <div className="min-w-0">
              <p className="truncate text-slate-900">{item.name}</p>
              <p className="text-xs text-slate-500">
                {item.qty} × {formatPaiseAsRupees(item.ratePaise)}
                {item.itemDiscountPct > 0 ? ` · -${item.itemDiscountPct}%` : ''}
              </p>
            </div>
            <span className="shrink-0 font-medium text-slate-900">
              {formatPaiseAsRupees(item.discountedAmountPaise)}
            </span>
          </div>
        ))}
      </div>

      <div className="hidden sm:block">
        <div className={`grid ${ITEM_GRID_COLS} gap-x-2 border-b border-slate-300 pb-1 text-left text-xs uppercase text-slate-500`}>
          <div>{t('bill.productName')}</div>
          <div className="text-right">{t('bill.rate')}</div>
          <div className="text-right">{t('bill.qty')}</div>
          <div className="text-right">{t('bill.itemDiscount')}</div>
          <div className="text-right">{t('bill.amount')}</div>
        </div>
        {data.items.map((item, i) => (
          <div
            key={i}
            className={`grid ${ITEM_GRID_COLS} gap-x-2 border-b border-slate-200 py-1.5`}
          >
            <div className="truncate pr-2">{item.name}</div>
            <div className="text-right">{formatPaiseAsRupees(item.ratePaise)}</div>
            <div className="text-right">{item.qty}</div>
            <div className="text-right">
              {item.itemDiscountPct > 0 ? `${item.itemDiscountPct}%` : '—'}
            </div>
            <div className="text-right">{formatPaiseAsRupees(item.discountedAmountPaise)}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-1 border-t border-dashed border-slate-300 pt-2">
        <SummaryRow label={t('bill.totalProductAmount')} value={data.totalProductAmountPaise} />
        <SummaryRow
          label={`${t('bill.overallDiscount')} (${data.overallDiscountPct}%)`}
          value={-data.overallDiscountPaise}
        />
        <SummaryRow label={t('bill.totalItemDiscount')} value={-data.totalItemDiscountPaise} />
        {data.roundOffPaise && data.roundOffPaise !== 0 ? (
          <SummaryRow label={t('bill.roundOff') || 'Round Off'} value={data.roundOffPaise} />
        ) : null}
        <SummaryRow label={t('bill.totalDiscount')} value={-data.totalDiscountPaise} />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2.5 text-base font-semibold text-blue-900">
        <span>{t('bill.netPayable')}</span>
        <span>{formatPaiseAsRupees(data.netPayableAmountPaise)}</span>
      </div>

      <div className="mt-3 flex flex-col gap-1 border-t border-dashed border-slate-300 pt-2">
        <SummaryRow label={t('bill.amountPaid')} value={data.amountPaidPaise} />
        <SummaryRow label={t('bill.due')} value={data.dueAmountPaise} />
        <p className="text-slate-500">
          {t('bill.paymentMode')}:{' '}
          {data.paymentModes.map((m) => t(`bill.paymentMode.${m.mode}`)).join(', ') || '—'}
        </p>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span>{formatPaiseAsRupees(value)}</span>
    </div>
  )
}
