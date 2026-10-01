import { jsPDF } from 'jspdf'
import { drawA4Bill } from '../pdf/drawA4Bill'
import { buildBillLabels } from '../billing/billLabels'
import { getCachedBusinessSettings } from '../../hooks/useBusinessSettings'
import type { BillPreviewData } from '../../features/billing/components/BillPreview'

/**
 * Builds the downloadable/shareable A4 invoice PDF. Used by both the
 * "Download PDF" action and the WhatsApp share flow (see shareToWhatsapp.ts).
 *
 * Draws directly onto the PDF with jsPDF's native primitives (text, lines,
 * rects) rather than rendering the React component to the DOM and
 * rasterizing it with html2canvas — see drawA4Bill.ts for why.
 *
 * `t` is optional: if a caller doesn't pass it (e.g. an older call site you
 * haven't updated yet), labels fall back to raw i18n keys instead of
 * throwing or breaking the build. Pass the real `t` from useT() wherever
 * you can so labels show properly translated text.
 */
export async function generateBillPdf(
  data: BillPreviewData,
  t: (key: string) => string = (key) => key,
): Promise<File> {
  const settings = await getCachedBusinessSettings()
  const labels = buildBillLabels(t)
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  drawA4Bill(pdf, data, settings, labels)
  const blob = pdf.output('blob')
  const billLabel = data.billNo === 'draft' ? 'draft' : data.billNo
  return new File([blob], `Bill-${billLabel}.pdf`, { type: 'application/pdf' })
}
