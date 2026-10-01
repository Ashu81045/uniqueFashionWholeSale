import { formatPaiseAsRupees } from '../billing/formatCurrency'
import { formatDisplayDate } from '../utils/date'
import { generateBillPdf } from './generateBillPdf'
import { getCachedBusinessSettings } from '../../hooks/useBusinessSettings'
import type { BillPreviewData } from '../../features/billing/components/BillPreview'

const INDIA_COUNTRY_CODE = '91'
const DEFAULT_BUSINESS_NAME = 'Unique Fashions Wholesale'

function billSummaryText(data: BillPreviewData, businessName: string): string {
  const billLabel = data.billNo === 'draft' ? '' : `Bill #${data.billNo} | `
  return (
    `${businessName}\n` +
    `${billLabel}${formatDisplayDate(data.date)}\n` +
    `Net Payable: ${formatPaiseAsRupees(data.netPayableAmountPaise)}\n` +
    `Paid: ${formatPaiseAsRupees(data.amountPaidPaise)} | Due: ${formatPaiseAsRupees(data.dueAmountPaise)}\n` +
    `Thank you!`
  )
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
}

export interface ShareResult {
  method: 'native-share' | 'download-and-wa-link'
}

/**
 * Shares a bill PDF to WhatsApp. On platforms that support the Web Share API
 * with file attachments (mostly Android Chrome/Samsung Internet), this opens
 * the native share sheet with the PDF attached directly. Everywhere else
 * (desktop, iOS Safari), click-to-chat (wa.me) cannot pre-attach a file — a
 * real platform limitation, not a bug — so we download the PDF and open the
 * WhatsApp chat with a text summary, leaving the user to attach it manually.
 */
export async function shareBillToWhatsapp(data: BillPreviewData): Promise<ShareResult> {
  const [pdfFile, settings] = await Promise.all([generateBillPdf(data), getCachedBusinessSettings()])
  const text = billSummaryText(data, settings?.businessName || DEFAULT_BUSINESS_NAME)

  const canUseNativeShare =
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [pdfFile] })

  if (canUseNativeShare) {
    await navigator.share({
      files: [pdfFile],
      text,
      title: data.billNo === 'draft' ? 'Bill' : `Bill #${data.billNo}`,
    })
    return { method: 'native-share' }
  }

  downloadFile(pdfFile)
  const mobileDigits = data.customerMobile.replace(/\D/g, '')
  const waLink = `https://wa.me/${INDIA_COUNTRY_CODE}${mobileDigits}?text=${encodeURIComponent(text)}`
  window.open(waLink, '_blank')
  return { method: 'download-and-wa-link' }
}
