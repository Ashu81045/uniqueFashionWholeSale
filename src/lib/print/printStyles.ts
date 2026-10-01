export type PrintFormat = 'thermal58' | 'thermal80' | 'a4'

const PAGE_RULES: Record<PrintFormat, string> = {
  thermal58: '@page { size: 58mm auto; margin: 2mm; }',
  thermal80: '@page { size: 80mm auto; margin: 3mm; }',
  a4: '@page { size: A4; margin: 12mm; }',
}

/**
 * Injects the @page rule for the chosen print format right before printing,
 * and returns a cleanup function to remove it afterwards. @page size can't be
 * scoped by a CSS class, so this is the simplest reliable way to switch
 * between thermal/A4 page dimensions per print job.
 */
export function injectPrintPageStyle(format: PrintFormat): () => void {
  const styleEl = document.createElement('style')
  styleEl.textContent = PAGE_RULES[format]
  document.head.appendChild(styleEl)
  return () => {
    document.head.removeChild(styleEl)
  }
}
