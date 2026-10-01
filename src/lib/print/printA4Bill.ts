import { buildA4BillHtml } from './buildA4BillHtml'
import { buildBillLabels } from '../billing/billLabels'
import type { BillPreviewData } from '../../features/billing/components/BillPreview'
import type { BusinessSettings } from '../../types/settings'

/**
 * Prints the A4 invoice using the oldest, most standard technique there is:
 * open a plain new browser window containing a hand-written HTML document
 * (no Tailwind, no React, no iframe/blob-URL timing tricks), then call
 * window.print() on it directly.
 *
 * This replaces both the earlier @media-print-CSS approach (which depended
 * on the browser's print engine correctly interpreting the app's Tailwind
 * layout) and the html2canvas/hidden-iframe approach (which depended on
 * blob-URL load timing inside an iframe). A plain new window with its own
 * document and window.print() is what invoicing/reporting web apps have
 * used reliably for decades — there's very little left here that can go
 * wrong in a browser-specific way.
 */
export function printA4Bill(
  data: BillPreviewData,
  settings: BusinessSettings | null | undefined,
  t: (key: string) => string,
) {
  const labels = buildBillLabels(t)
  const html = buildA4BillHtml(data, settings, labels)

  const printWindow = window.open('', '_blank', 'width=850,height=1100')
  if (!printWindow) {
    window.alert('Please allow pop-ups for this site to print the bill.')
    return
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()

  let printed = false
  const triggerPrint = () => {
    if (printed) return
    printed = true
    try {
      printWindow.focus()
      printWindow.print()
    } catch {
      // Window was closed (or otherwise unreachable) before we could print — ignore.
    }
  }

  // onload usually fires once the written document has finished parsing;
  // the short fallback timeout covers browsers where it doesn't fire
  // reliably after document.write().
  printWindow.onload = triggerPrint
  setTimeout(triggerPrint, 400)

  // Fires whether the user actually printed or cancelled the dialog — safe
  // to use as a general "we're done with this popup" signal.
  printWindow.onafterprint = () => {
    printWindow.close()
  }
}