import { useT } from '../../i18n/I18nContext'
import { formatPaiseAsRupees } from '../../lib/billing/formatCurrency'
import { formatDisplayDate } from '../../lib/utils/date'
import type { BillPreviewData } from '../../features/billing/components/BillPreview'
import type { BusinessSettings } from '../../types/settings'

/** Condensed single-column receipt layout for 58mm/80mm thermal printers. */
export function ThermalBillLayout({
  data,
  settings,
}: {
  data: BillPreviewData
  settings?: BusinessSettings | null
}) {
  const t = useT()
  return (
    <div className="w-full font-mono text-[11px] leading-tight text-black">
      <div className="text-center">
        <p className="text-sm font-bold">{settings?.businessName || t('app.name')}</p>
        {settings?.phone && <p>Ph: {settings.phone}</p>}
        <p>{formatDisplayDate(data.date)}</p>
        <p>
          {t('bill.number')}: {data.billNo === 'draft' ? '—' : data.billNo}
        </p>
      </div>
      <hr className="my-1 border-dashed border-black" />
      <p>{data.customerName}</p>
      <p>{data.customerMobile}</p>
      <hr className="my-1 border-dashed border-black" />

      {data.items.map((item, i) => (
        <div key={i} className="mb-0.5">
          <div className="flex justify-between">
            <span>{item.name}</span>
            <span>{formatPaiseAsRupees(item.discountedAmountPaise)}</span>
          </div>
          <div className="flex justify-between text-[10px] text-neutral-700">
            <span>
              {item.qty} x {formatPaiseAsRupees(item.ratePaise)}
              {item.itemDiscountPct > 0 ? ` (-${item.itemDiscountPct}%)` : ''}
            </span>
          </div>
        </div>
      ))}

      <hr className="my-1 border-dashed border-black" />
      <Row label={t('bill.totalProductAmount')} value={data.totalProductAmountPaise} />
      <Row label={t('bill.overallDiscount')} value={-data.overallDiscountPaise} />
      <Row label={t('bill.totalItemDiscount')} value={-data.totalItemDiscountPaise} />
      {data.roundOffPaise && data.roundOffPaise !== 0 ? (
        <Row label={t('bill.roundOff') || 'Round Off'} value={data.roundOffPaise} />
      ) : null}
      <Row label={t('bill.totalDiscount')} value={-data.totalDiscountPaise} />
      <hr className="my-1 border-dashed border-black" />
      <Row label={t('bill.netPayable')} value={data.netPayableAmountPaise} bold />
      <Row label={t('bill.amountPaid')} value={data.amountPaidPaise} />
      <Row label={t('bill.due')} value={data.dueAmountPaise} />

      <p className="mt-2 text-center">{t('bill.paymentMode')}: {data.paymentModes.map((m) => t(`bill.paymentMode.${m.mode}`)).join(', ') || '-'}</p>
      <p className="mt-2 text-center">{settings?.invoiceFooter || 'Thank you!'}</p>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold' : ''}`}>
      <span>{label}</span>
      <span>{formatPaiseAsRupees(value)}</span>
    </div>
  )
}
