import { useT } from '../../i18n/I18nContext'
import { formatPaiseAsRupees } from '../../lib/billing/formatCurrency'
import { formatDisplayDate } from '../../lib/utils/date'
import type { BillPreviewData } from '../../features/billing/components/BillPreview'
import type { BusinessSettings } from '../../types/settings'

/**
 * Full-page invoice layout for A4 printing. Also reused (rasterized via
 * html2canvas) as the source for the shareable PDF — see lib/share/generateBillPdf.ts.
 * `settings` is optional so this still renders sensibly before Settings has
 * ever been filled in (generic placeholders) or if the read hasn't resolved yet.
 *
 * NOTE: this component assumes the page/print context sets:
 *   @media print { @page { size: A4; margin: 0; } html, body { margin: 0; padding: 0; } }
 * Without that reset, the browser's own print margins can squeeze this
 * 210mm-wide box into a narrower printable area and clip the right edge.
 *
 * The item grid intentionally uses CSS Grid, not <table>/<colgroup>. Native
 * table column-width hints (via <col>) are unreliable across both browser
 * print engines and html2canvas — columns can collide/overlap instead of
 * respecting their assigned widths. `grid-template-columns` is rendered
 * consistently by all three (screen, print, html2canvas capture).
 *
 * DUE DATE: per the shop's own rule (bill date + 75 days), computed here
 * with `addDays` rather than stored, so it always stays in sync with the
 * bill date even if that's edited later.
 *
 * ⚠️ `data.customerAddress` is a NEW field this layout expects on
 * `BillPreviewData`. It doesn't exist on the type yet — add
 * `customerAddress?: string` there and wire up a manual text input
 * wherever customerName/customerMobile are currently collected.
 */
const ITEM_GRID_COLS = 'grid-cols-[3.8fr_1.6fr_1fr_1.6fr_2fr]'

function addDays(date: string | Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function A4BillLayout({ data, settings }: { data: BillPreviewData; settings?: BusinessSettings | null }) {
  const t = useT()
  const dueDate = addDays(data.date, 75)

  return (
    <div className="w-[210mm] bg-white p-[15mm] text-[#000000] opacity-100">
      {/* 1. Brand name — centered, bold, big */}
      <div className="mb-4 border-b-4 border-black pb-4 text-center">
        <h1 className="text-4xl font-extrabold uppercase tracking-wide">
          {settings?.businessName || t('app.name')}
        </h1>
        <p className="mt-1 text-base font-semibold text-[#000000] opacity-100">
          {settings?.address || 'Wholesale Garments'}
        </p>
        {(settings?.phone || settings?.gstNumber) && (
          <p className="mt-0.5 text-sm font-medium text-[#000000] opacity-100">
            {settings?.phone && `Ph: ${settings.phone}`}
            {settings?.phone && settings?.gstNumber && ' | '}
            {settings?.gstNumber && `GSTIN: ${settings.gstNumber}`}
          </p>
        )}
      </div>

      {/* Bill No + Bill Date (6. billing date must be visible) */}
      <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-2 text-base font-bold">
        <p>
          {t('bill.number')}: <span>{data.billNo === 'draft' ? '—' : data.billNo}</span>
        </p>
        <p>
          Bill Datess: <span>{formatDisplayDate(data.date)}</span>
        </p>
      </div>

      {/* 2. First row: Name, Number, Address — bordered columns */}
      <div className="mb-6 grid grid-cols-3 divide-x-2 divide-black border-2 border-black text-base">
        <div className="p-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#000000] opacity-100">
            {t('bill.customer')}
          </p>
          <p className="text-lg font-bold">{data.customerName}</p>
        </div>
        <div className="p-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#000000] opacity-100">Number</p>
          <p className="text-lg font-bold">{data.customerMobile}</p>
        </div>
        <div className="p-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#000000] opacity-100">Address</p>
          {/* Manually entered — no existing source field for this yet */}
          <p className="text-lg font-bold">{data.customerAddress || '—'}</p>
        </div>
      </div>

      {/* 3 & 4. Bigger/bolder fonts + full row & column grid lines */}
      <div className="border-2 border-black text-base">
        <div
          className={`grid ${ITEM_GRID_COLS} divide-x-2 divide-black border-b-2 border-black font-extrabold`}
        >
          <div className="p-2">{t('bill.productName')}</div>
          <div className="p-2 text-right">{t('bill.rate')}</div>
          <div className="p-2 text-right">{t('bill.qty')}</div>
          <div className="p-2 text-right">{t('bill.itemDiscount')}</div>
          <div className="p-2 text-right">{t('bill.amount')}</div>
        </div>
        {data.items.map((item, i) => (
          <div
            key={i}
            className={`grid ${ITEM_GRID_COLS} divide-x-2 divide-black font-semibold ${
              i === data.items.length - 1 ? '' : 'border-b-2 border-black'
            }`}
          >
            <div className="break-words p-2">{item.name}</div>
            <div className="p-2 text-right">{formatPaiseAsRupees(item.ratePaise)}</div>
            <div className="p-2 text-right">{item.qty}</div>
            <div className="p-2 text-right">
              {item.itemDiscountPct > 0 ? `${item.itemDiscountPct}%` : '—'}
            </div>
            <div className="p-2 text-right">{formatPaiseAsRupees(item.discountedAmountPaise)}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-start justify-between gap-6">
        <div className="text-base font-semibold text-[#000000] opacity-100">
          <p>
            {t('bill.paymentMode')}:{' '}
            {data.paymentModes.map((m) => t(`bill.paymentMode.${m.mode}`)).join(', ') || '—'}
          </p>
        </div>

        <div className="flex w-72 flex-col gap-1 text-base font-semibold">
          <Row label={t('bill.totalProductAmount')} value={data.totalProductAmountPaise} />
          <Row
            label={`${t('bill.overallDiscount')} (${data.overallDiscountPct}%)`}
            value={-data.overallDiscountPaise}
          />
          <Row label={t('bill.totalItemDiscount')} value={-data.totalItemDiscountPaise} />
          {data.roundOffPaise && data.roundOffPaise !== 0 ? (
            <Row label={t('bill.roundOff') || 'Round Off'} value={data.roundOffPaise} />
          ) : null}
          <Row label={t('bill.totalDiscount')} value={-data.totalDiscountPaise} />
          <Row label={t('bill.netPayable')} value={data.netPayableAmountPaise} emphasize />
          <Row label={t('bill.amountPaid')} value={data.amountPaidPaise} />
          <Row label={t('bill.due')} value={data.dueAmountPaise} />

          {/* 5. Due date — bottom right, bill date + 75 days. Biggest, most visible element in the breakup. */}
          <div className="mt-3 flex flex-col items-end gap-1 border-4 border-black p-3">
            <span className="text-base font-bold uppercase tracking-wide">Due Date</span>
            <span className="text-[32px] font-extrabold leading-none">{formatDisplayDate(dueDate)}</span>
          </div>
        </div>
      </div>

      <p className="mt-10 border-t-2 border-black pt-4 text-center text-sm font-semibold text-[#000000] opacity-100">
        {settings?.invoiceFooter || 'Thank you for your business!'}
      </p>
    </div>
  )
}

function Row({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div className={`flex justify-between ${emphasize ? 'text-xl font-extrabold' : 'font-semibold'}`}>
      <span>{label}</span>
      <span>{formatPaiseAsRupees(value)}</span>
    </div>
  )
}