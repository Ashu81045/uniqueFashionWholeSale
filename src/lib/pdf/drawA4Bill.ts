import type { jsPDF } from 'jspdf'
import { formatPaiseAsRupees } from '../billing/formatCurrency'
import { formatDisplayDate } from '../utils/date'
import type { BillPreviewData } from '../../features/billing/components/BillPreview'
import type { BusinessSettings } from '../../types/settings'
import type { BillLabels } from '../billing/billLabels'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 15

// Column layout in mm, left edges + widths. Widths sum to 180 = the full
// content width (210 - 15 margin each side). Everything is placed with
// explicit jsPDF text()/line() calls at these coordinates — there is no
// CSS, no table, no grid for a renderer to misinterpret.
const COLS = {
  name: { x: MARGIN, w: 70 },
  rate: { x: MARGIN + 70, w: 28 },
  qty: { x: MARGIN + 98, w: 18 },
  discount: { x: MARGIN + 116, w: 28 },
  amount: { x: MARGIN + 144, w: 36 },
}
function colRight(col: { x: number; w: number }) {
  return col.x + col.w
}

const INK: [number, number, number] = [0, 0, 0]
const MUTED: [number, number, number] = [110, 110, 110]
const LINE: [number, number, number] = [220, 220, 220]

/**
 * jsPDF's built-in fonts (Helvetica etc.) only support the WinAnsi/Latin-1
 * character set — the ₹ glyph is NOT in that set and would silently fail to
 * render (blank space or a missing-glyph box). "Rs." is used here instead
 * to guarantee correct rendering without needing to embed a custom Unicode
 * font. If you want the literal ₹ symbol in the PDF, that requires
 * embedding a font file (e.g. Noto Sans) via pdf.addFileToVFS/addFont.
 */
function formatMoneyForPdf(paise: number): string {
  return formatPaiseAsRupees(paise).replace('₹', 'Rs. ')
}

function drawHeader(
  pdf: jsPDF,
  data: BillPreviewData,
  settings: BusinessSettings | null | undefined,
  labels: BillLabels,
): number {
  let y = MARGIN + 6
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.setTextColor(...INK)
  pdf.text(settings?.businessName || labels.appName, MARGIN, y)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...MUTED)
  y += 5
  pdf.text(settings?.address || 'Wholesale Garments', MARGIN, y)

  if (settings?.phone || settings?.gstNumber) {
    y += 4.5
    const parts = [
      settings?.phone ? `Ph: ${settings.phone}` : '',
      settings?.gstNumber ? `GSTIN: ${settings.gstNumber}` : '',
    ].filter(Boolean)
    pdf.setFontSize(8)
    pdf.text(parts.join('  |  '), MARGIN, y)
  }

  pdf.setFontSize(9)
  pdf.setTextColor(...INK)
  const billNoText = `${labels.billNumber}: ${data.billNo === 'draft' ? '—' : data.billNo}`
  pdf.text(billNoText, PAGE_WIDTH - MARGIN, MARGIN + 6, { align: 'right' })
  pdf.setTextColor(...MUTED)
  pdf.text(formatDisplayDate(data.date), PAGE_WIDTH - MARGIN, MARGIN + 11, { align: 'right' })

  const bottomY = Math.max(y, MARGIN + 11) + 4
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(0.6)
  pdf.line(MARGIN, bottomY, PAGE_WIDTH - MARGIN, bottomY)
  return bottomY + 8
}

function drawCustomer(pdf: jsPDF, data: BillPreviewData, labels: BillLabels, startY: number): number {
  let y = startY
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...MUTED)
  pdf.text(labels.customer.toUpperCase(), MARGIN, y)
  y += 5.5
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...INK)
  pdf.text(data.customerName, MARGIN, y)
  y += 5
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...MUTED)
  pdf.text(data.customerMobile, MARGIN, y)
  return y + 7
}

function drawItemsHeader(pdf: jsPDF, labels: BillLabels, y: number): number {
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(...INK)
  pdf.text(labels.productName, COLS.name.x, y)
  pdf.text(labels.rate, colRight(COLS.rate), y, { align: 'right' })
  pdf.text(labels.qty, colRight(COLS.qty), y, { align: 'right' })
  pdf.text(labels.itemDiscount, colRight(COLS.discount), y, { align: 'right' })
  pdf.text(labels.amount, colRight(COLS.amount), y, { align: 'right' })
  const lineY = y + 2
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(0.6)
  pdf.line(MARGIN, lineY, PAGE_WIDTH - MARGIN, lineY)
  return lineY + 6
}

function drawItems(pdf: jsPDF, data: BillPreviewData, labels: BillLabels, startY: number): number {
  let y = drawItemsHeader(pdf, labels, startY)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)

  for (const item of data.items) {
    const nameLines = pdf.splitTextToSize(item.name, COLS.name.w - 2) as string[]
    const rowHeight = Math.max(6, nameLines.length * 4.2 + 2)

    // Page-break: if this row won't fit, start a fresh page and repeat the
    // column header so a split table is still readable.
    if (y + rowHeight > PAGE_HEIGHT - MARGIN) {
      pdf.addPage()
      y = MARGIN
      y = drawItemsHeader(pdf, labels, y)
    }

    pdf.setTextColor(...INK)
    pdf.text(nameLines, COLS.name.x, y)
    pdf.text(formatMoneyForPdf(item.ratePaise), colRight(COLS.rate), y, { align: 'right' })
    pdf.text(String(item.qty), colRight(COLS.qty), y, { align: 'right' })
    pdf.text(
      item.itemDiscountPct > 0 ? `${item.itemDiscountPct}%` : '—',
      colRight(COLS.discount),
      y,
      { align: 'right' },
    )
    pdf.text(formatMoneyForPdf(item.discountedAmountPaise), colRight(COLS.amount), y, { align: 'right' })

    const lineY = y + rowHeight - 2
    pdf.setDrawColor(...LINE)
    pdf.setLineWidth(0.3)
    pdf.line(MARGIN, lineY, PAGE_WIDTH - MARGIN, lineY)

    y += rowHeight
  }

  return y + 4
}

function drawSummary(pdf: jsPDF, data: BillPreviewData, labels: BillLabels, startY: number): number {
  const boxWidth = 70
  const boxX = PAGE_WIDTH - MARGIN - boxWidth
  let y = startY

  if (y + 45 > PAGE_HEIGHT - MARGIN) {
    pdf.addPage()
    y = MARGIN
  }

  const row = (label: string, value: number, opts: { bold?: boolean; size?: number } = {}) => {
    pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    pdf.setFontSize(opts.size ?? 9)
    pdf.setTextColor(...INK)
    pdf.text(label, boxX, y)
    pdf.text(formatMoneyForPdf(value), PAGE_WIDTH - MARGIN, y, { align: 'right' })
    y += 5.5
  }

  row(labels.totalProductAmount, data.totalProductAmountPaise)
  row(`${labels.overallDiscount} (${data.overallDiscountPct}%)`, -data.overallDiscountPaise)
  row(labels.totalItemDiscount, -data.totalItemDiscountPaise)
  row(labels.totalDiscount, -data.totalDiscountPaise)

  y += 1
  pdf.setFillColor(240, 244, 255)
  pdf.rect(boxX - 2, y - 4.5, boxWidth + 2 + (PAGE_WIDTH - MARGIN - (boxX + boxWidth)), 7, 'F')
  row(labels.netPayable, data.netPayableAmountPaise, { bold: true, size: 10.5 })
  y += 1

  row(labels.amountPaid, data.amountPaidPaise)
  row(labels.due, data.dueAmountPaise)

  return y + 3
}

function drawFooter(
  pdf: jsPDF,
  data: BillPreviewData,
  settings: BusinessSettings | null | undefined,
  labels: BillLabels,
  startY: number,
) {
  let y = startY
  if (y + 20 > PAGE_HEIGHT - MARGIN) {
    pdf.addPage()
    y = MARGIN
  }
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...MUTED)
  const modeText = `${labels.paymentMode}: ${
    data.paymentModes.map((m) => labels.paymentModeLabel(m.mode)).join(', ') || '—'
  }`
  pdf.text(modeText, MARGIN, y)
  y += 12

  pdf.setDrawColor(...LINE)
  pdf.setLineWidth(0.3)
  pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 6
  pdf.setFontSize(8)
  pdf.text(settings?.invoiceFooter || 'Thank you for your business!', PAGE_WIDTH / 2, y, { align: 'center' })
}

/**
 * Draws the full A4 invoice directly onto a jsPDF document using jsPDF's
 * native text/line/rect primitives — no DOM, no CSS, no html2canvas
 * rasterization. This is the single source of truth for what the A4 bill
 * looks like: the same drawing is used both for the downloadable PDF
 * (lib/share/generateBillPdf.ts) and for physical printing
 * (lib/print/printA4Bill.ts), so the two can never disagree with each other
 * the way the DOM+CSS approach did.
 */
export function drawA4Bill(
  pdf: jsPDF,
  data: BillPreviewData,
  settings: BusinessSettings | null | undefined,
  labels: BillLabels,
) {
  let y = drawHeader(pdf, data, settings, labels)
  y = drawCustomer(pdf, data, labels, y)
  y = drawItems(pdf, data, labels, y)
  y = drawSummary(pdf, data, labels, y)
  drawFooter(pdf, data, settings, labels, y)
}