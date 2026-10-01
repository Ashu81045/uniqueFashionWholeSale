import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Download,
  Printer,
  Share2,
  XCircle,
} from 'lucide-react'
import { useT } from '../../i18n/I18nContext'
import { Spinner } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { RoleGate } from '../../components/layout/RoleGate'
import { BillPreview } from '../billing/components/BillPreview'
import { PrintRoot } from '../../components/print/PrintRoot'
import { usePrintFormat } from '../../lib/print/usePrintFormat'
import { printA4Bill } from '../../lib/print/printA4Bill'
import { generateBillPdf } from '../../lib/share/generateBillPdf'
import { shareBillToWhatsapp } from '../../lib/share/shareToWhatsapp'
import { cancelBillTransaction } from '../../lib/numbering/cancelBillTransaction'
import { useBusinessSettings } from '../../hooks/useBusinessSettings'
import { useAuthStore } from '../../stores/authStore'
import { fetchBillById } from './billsQuery'
import { billToPreviewData } from './billToPreviewData'
import type { Bill, PaymentStatus } from '../../types/bill'

const statusTone: Record<PaymentStatus, 'green' | 'amber' | 'red'> = {
  paid: 'green',
  partial: 'amber',
  credit: 'red',
}

export function BillDetailPage() {
  const t = useT()
  const { billId } = useParams<{ billId: string }>()
  const session = useAuthStore((s) => s.session)
  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const { activeFormat, printAs } = usePrintFormat()
  const { settings } = useBusinessSettings()
  const [sharing, setSharing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  function load() {
    if (!billId) return
    setLoading(true)
    fetchBillById(billId)
      .then(setBill)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billId])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (!bill) {
    return <p className="p-4 text-sm text-slate-500">—</p>
  }

  const previewData = billToPreviewData(bill)

  async function handleDownloadPdf() {
    setDownloading(true)
    try {
      const file = await generateBillPdf(previewData, t)
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  function handlePrintA4() {
    printA4Bill(previewData, settings, t)
  }

  async function handleShareWhatsapp() {
    setSharing(true)
    try {
      await shareBillToWhatsapp(previewData)
    } catch (err) {
      // AbortError happens when the user just closes the native share sheet — not a failure.
      if (!(err instanceof Error) || err.name !== 'AbortError') {
        console.error(err)
      }
    } finally {
      setSharing(false)
    }
  }

  async function handleCancelBill() {
    if (!bill || !session) return
    if (!window.confirm(`${t('bill.cancelBill')} #${bill.billNo}?`)) return
    setCancelling(true)
    try {
      await cancelBillTransaction(bill.id, session.uid)
      load()
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <div className="no-print flex flex-col gap-4 p-4">
        <Link
          to="/bills"
          className="flex w-fit items-center gap-1 text-sm text-slate-500 transition-colors hover:text-blue-400"
        >
          <ArrowLeft size={14} />
          {t('nav.bills')}
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">
            {t('bill.number')} #{bill.billNo}
          </h1>
          <div className="flex items-center gap-2">
            {bill.status === 'cancelled' && <Badge tone="red">{t('bill.cancelled')}</Badge>}
            <Badge tone={statusTone[bill.paymentStatus]}>{t(`bill.${bill.paymentStatus}`)}</Badge>
            <Link
              to={`/ledger/${bill.customerId}`}
              className="flex items-center gap-1 text-sm font-medium text-blue-400 hover:underline"
            >
              <BookOpen size={14} />
              {t('nav.ledger')}
            </Link>
          </div>
        </div>

        <BillPreview data={previewData} />

        <Card className="flex flex-wrap gap-2 p-3">
          <Button variant="secondary" onClick={() => printAs('thermal58')}>
            <Printer size={15} />
            {t('bill.printThermal58')}
          </Button>
          <Button variant="secondary" onClick={() => printAs('thermal80')}>
            <Printer size={15} />
            {t('bill.printThermal80')}
          </Button>
          <Button variant="secondary" onClick={handlePrintA4}>
            <Printer size={15} />
            {t('bill.printA4')}
          </Button>
          <Button variant="secondary" onClick={handleDownloadPdf} disabled={downloading}>
            {downloading ? <Spinner /> : <Download size={15} />}
            {t('common.download')}
          </Button>
          <Button onClick={handleShareWhatsapp} disabled={sharing}>
            {sharing ? <Spinner tone="dark" /> : <Share2 size={15} />}
            {t('common.share')}
          </Button>
          {bill.status === 'active' && (
            <RoleGate roles={['admin']}>
              <Button variant="danger" onClick={handleCancelBill} disabled={cancelling}>
                {cancelling ? <Spinner tone="white" /> : <XCircle size={15} />}
                {t('bill.cancelBill')}
              </Button>
            </RoleGate>
          )}
        </Card>
      </div>

      {/* PrintRoot is now only reached by the thermal58/thermal80 buttons —
          the A4 button prints via printA4Bill (native PDF print) instead. */}
      <PrintRoot format={activeFormat} data={previewData} settings={settings} />
    </>
  )
}
