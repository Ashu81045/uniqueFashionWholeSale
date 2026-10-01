import type { PrintFormat } from '../../lib/print/printStyles'
import type { BillPreviewData } from '../../features/billing/components/BillPreview'
import type { BusinessSettings } from '../../types/settings'
import { ThermalBillLayout } from './ThermalBillLayout'
import { A4BillLayout } from './A4BillLayout'

/**
 * Only rendered (and only visible, via `print:block`) while a print job is
 * active — see usePrintFormat. Keeping this out of normal layout flow means
 * the on-screen preview never doubles up in the printed output.
 */
export function PrintRoot({
  format,
  data,
  settings,
}: {
  format: PrintFormat | null
  data: BillPreviewData
  settings?: BusinessSettings | null
}) {
  if (!format) return null
  return (
    <div className="hidden print:fixed print:inset-0 print:block print:bg-white">
      {format === 'a4' ? (
        <A4BillLayout data={data} settings={settings} />
      ) : (
        <ThermalBillLayout data={data} settings={settings} />
      )}
    </div>
  )
}
