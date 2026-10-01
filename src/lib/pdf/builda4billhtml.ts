import { formatPaiseAsRupees } from '../billing/formatCurrency'
import { formatDisplayDate } from '../utils/date'
import type { BillPreviewData } from '../../features/billing/components/BillPreview'
import type { BusinessSettings } from '../../types/settings'
import type { BillLabels } from '../billing/billLabels'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Builds a full, standalone HTML document for the A4 invoice — plain inline
 * <style>, no Tailwind, no React component, and deliberately no flexbox or
 * <colgroup> — just plain HTML tables with column widths on the <th>/<td>
 * elements directly. Tables are the single most universally and
 * consistently supported layout primitive across every rendering engine
 * (this was tested against a notoriously weak HTML renderer as a
 * worst-case check, and every column stayed fully visible with no
 * collision). No dependency on the app's own stylesheet, JIT-generated
 * utility classes, or html2canvas correctly interpreting any of it.
 */
export function buildA4BillHtml(
  data: BillPreviewData,
  settings: BusinessSettings | null | undefined,
  labels: BillLabels,
): string {
  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td class="num">${formatPaiseAsRupees(item.ratePaise)}</td>
      <td class="num">${item.qty}</td>
      <td class="num">${item.itemDiscountPct > 0 ? `${item.itemDiscountPct}%` : '—'}</td>
      <td class="num">${formatPaiseAsRupees(item.discountedAmountPaise)}</td>
    </tr>`,
    )
    .join('')

  const paymentModeText =
    data.paymentModes.map((m) => labels.paymentModeLabel(m.mode)).join(', ') || '—'

  const contactLine = [
    settings?.phone ? `Ph: ${escapeHtml(settings.phone)}` : '',
    settings?.gstNumber ? `GSTIN: ${escapeHtml(settings.gstNumber)}` : '',
  ]
    .filter(Boolean)
    .join(' &nbsp;|&nbsp; ')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(labels.billNumber)} ${data.billNo === 'draft' ? '' : data.billNo}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; }
  table { border-collapse: collapse; }
  .header-table { width: 100%; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #000; }
  .business-name { font-size: 20px; font-weight: bold; margin: 0 0 4px; }
  .muted { color: #666; margin: 2px 0; }
  .small { font-size: 11px; }
  .bill-meta { text-align: right; }
  .bill-meta p { margin: 2px 0; font-size: 13px; }
  .customer { margin-bottom: 20px; }
  .customer .label { font-size: 11px; text-transform: uppercase; color: #666; margin: 0; }
  .customer .name { font-size: 16px; font-weight: 600; margin: 4px 0; }
  .items-table { width: 100%; font-size: 13px; }
  .items-table thead tr { border-bottom: 2px solid #000; }
  .items-table th, .items-table td { padding: 6px 4px; text-align: left; }
  .items-table th.num, .items-table td.num { text-align: right; }
  .items-table tbody tr { border-bottom: 1px solid #ddd; }
  .summary-table { width: 260px; margin-left: auto; margin-top: 16px; font-size: 13px; }
  .summary-table td { padding: 3px 0; }
  .summary-table td.val { text-align: right; }
  .net-payable td { font-weight: bold; font-size: 15px; background: #eef2ff; padding: 6px 8px; }
  .payment-mode { margin-top: 16px; font-size: 13px; color: #666; }
  .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 12px; text-align: center; font-size: 12px; color: #666; }
</style>
</head>
<body>
  <table class="header-table"><tr>
    <td style="vertical-align: top;">
      <p class="business-name">${escapeHtml(settings?.businessName || labels.appName)}</p>
      <p class="muted small">${escapeHtml(settings?.address || 'Wholesale Garments')}</p>
      ${contactLine ? `<p class="muted small">${contactLine}</p>` : ''}
    </td>
    <td class="bill-meta" style="vertical-align: top;">
      <p>${escapeHtml(labels.billNumber)}: <strong>${data.billNo === 'draft' ? '—' : data.billNo}</strong></p>
      <p class="muted">${formatDisplayDate(data.date)}</p>
    </td>
  </tr></table>

  <div class="customer">
    <p class="label">${escapeHtml(labels.customer)}</p>
    <p class="name">${escapeHtml(data.customerName)}</p>
    <p class="muted">${escapeHtml(data.customerMobile)}</p>
  </div>

  <table class="items-table">
    <thead><tr>
      <th style="width:38%">${escapeHtml(labels.productName)}</th>
      <th class="num" style="width:16%">${escapeHtml(labels.rate)}</th>
      <th class="num" style="width:10%">${escapeHtml(labels.qty)}</th>
      <th class="num" style="width:16%">${escapeHtml(labels.itemDiscount)}</th>
      <th class="num" style="width:20%">${escapeHtml(labels.amount)}</th>
    </tr></thead>
    <tbody>${itemRows}
    </tbody>
  </table>

  <table class="summary-table">
    <tr><td>${escapeHtml(labels.totalProductAmount)}</td><td class="val">${formatPaiseAsRupees(data.totalProductAmountPaise)}</td></tr>
    <tr><td>${escapeHtml(labels.overallDiscount)} (${data.overallDiscountPct}%)</td><td class="val">${formatPaiseAsRupees(-data.overallDiscountPaise)}</td></tr>
    <tr><td>${escapeHtml(labels.totalItemDiscount)}</td><td class="val">${formatPaiseAsRupees(-data.totalItemDiscountPaise)}</td></tr>
    <tr><td>${escapeHtml(labels.totalDiscount)}</td><td class="val">${formatPaiseAsRupees(-data.totalDiscountPaise)}</td></tr>
    <tr class="net-payable"><td>${escapeHtml(labels.netPayable)}</td><td class="val">${formatPaiseAsRupees(data.netPayableAmountPaise)}</td></tr>
    <tr><td>${escapeHtml(labels.amountPaid)}</td><td class="val">${formatPaiseAsRupees(data.amountPaidPaise)}</td></tr>
    <tr><td>${escapeHtml(labels.due)}</td><td class="val">${formatPaiseAsRupees(data.dueAmountPaise)}</td></tr>
  </table>

  <p class="payment-mode">${escapeHtml(labels.paymentMode)}: ${escapeHtml(paymentModeText)}</p>

  <div class="footer">${escapeHtml(settings?.invoiceFooter || 'Thank you for your business!')}</div>
</body>
</html>`
}