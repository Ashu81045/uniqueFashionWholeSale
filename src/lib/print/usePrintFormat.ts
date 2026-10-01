import { useState } from 'react'
import { injectPrintPageStyle, type PrintFormat } from './printStyles'

/**
 * Drives the print-format picker: sets which layout is mounted into the
 * print-only DOM node, injects the matching @page rule, then triggers
 * window.print(). Only one format's layout is mounted at a time so the
 * browser never prints more than the intended tree.
 */
export function usePrintFormat() {
  const [activeFormat, setActiveFormat] = useState<PrintFormat | null>(null)

  function printAs(format: PrintFormat) {
    setActiveFormat(format)
    // Let React commit the newly-mounted print layout before opening the
    // print dialog, otherwise window.print() can fire against stale DOM.
    requestAnimationFrame(() => {
      const cleanup = injectPrintPageStyle(format)
      window.print()
      cleanup()
      setActiveFormat(null)
    })
  }

  return { activeFormat, printAs }
}
