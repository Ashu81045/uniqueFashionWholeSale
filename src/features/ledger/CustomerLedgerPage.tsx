import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Coins, PiggyBank, Printer, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useT } from '../../i18n/I18nContext'
import { useAuthStore } from '../../stores/authStore'
import { Spinner } from '../../components/ui/Spinner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { formatPaiseAsRupees, rupeesToPaise } from '../../lib/billing/formatCurrency'
import { formatDisplayDate, toDateKey } from '../../lib/utils/date'
import { getCustomerByMobile } from '../customers/customerService'
import { fetchCustomerLedger, recordPayment, type LedgerRow } from './ledgerService'
import { LedgerTable } from './components/LedgerTable'
import { DateRangeFilter, type PeriodPreset } from '../../components/ui/DateRangeFilter'
import type { Customer } from '../../types/customer'
import type { PaymentMode } from '../../types/payment'

const PAYMENT_MODES: PaymentMode[] = ['cash', 'upi', 'gpay', 'phonepe', 'bank_transfer', 'other']

export function CustomerLedgerPage() {
  const t = useT()
  const { mobile } = useParams<{ mobile: string }>()
  const session = useAuthStore((s) => s.session)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [loading, setLoading] = useState(true)

  // Payment form state
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<PaymentMode>('cash')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Date Range filter for customer statement
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [preset, setPreset] = useState<PeriodPreset>('all')

  async function load() {
    if (!mobile) return
    setLoading(true)
    try {
      const [c, ledgerRows] = await Promise.all([
        getCustomerByMobile(mobile),
        fetchCustomerLedger(mobile),
      ])
      setCustomer(c)
      setRows(ledgerRows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile])

  async function handleRecordPayment() {
    if (!mobile || !session) return
    const amountPaise = rupeesToPaise(Number(amount))
    if (amountPaise <= 0) return
    setSaving(true)
    try {
      await recordPayment(mobile, amountPaise, mode, note, session.uid, session.role)
      setAmount('')
      setNote('')
      await load()
    } finally {
      setSaving(false)
    }
  }

  // Filter ledger rows by selected date range
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (startDate && endDate) {
        const k = toDateKey(r.date)
        if (k < startDate || k > endDate) {
          return false
        }
      }
      return true
    })
  }, [rows, startDate, endDate])

  // Analytics for the customer in the selected date range
  const statementAnalytics = useMemo(() => {
    let periodDebits = 0
    let periodCredits = 0

    for (const r of filteredRows) {
      periodDebits += r.debitPaise || 0
      periodCredits += r.creditPaise || 0
    }

    return {
      count: filteredRows.length,
      periodDebits,
      periodCredits,
      netChange: periodDebits - periodCredits,
    }
  }, [filteredRows])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (!customer) {
    return <p className="p-4 text-sm text-slate-500">—</p>
  }

  const fetchedDebits = rows.reduce((total, r) => total + r.debitPaise, 0)
  const fetchedCredits = rows.reduce((total, r) => total + r.creditPaise, 0)
  const openingBalancePaise = customer.outstandingBalancePaise - (fetchedDebits - fetchedCredits)
  const hasOutstanding = customer.outstandingBalancePaise > 0

  return (
    <div className="flex animate-fade-in flex-col gap-4 p-4">
      {/* Customer Header Bar */}
      <div className="flex items-center gap-3 bg-slate-100 p-4 rounded-2xl border border-slate-200">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-950/60 text-lg font-bold text-blue-400 border border-blue-500/30">
          {customer.name[0]?.toUpperCase() ?? '?'}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-slate-900">{customer.name}</h1>
          <p className="text-xs text-slate-400 font-semibold">{customer.mobile}</p>
        </div>
        <div
          className={`shrink-0 rounded-xl px-3.5 py-2 text-right border ${
            hasOutstanding ? 'bg-red-950/50 border-red-500/40' : 'bg-green-950/50 border-green-500/40'
          }`}
        >
          <p className={`text-[11px] font-semibold ${hasOutstanding ? 'text-red-300' : 'text-green-300'}`}>
            {hasOutstanding ? 'Kul Baaki Udhar' : 'Khata Barabar'}
          </p>
          <p className={`text-base font-bold ${hasOutstanding ? 'text-red-400' : 'text-green-400'}`}>
            {formatPaiseAsRupees(customer.outstandingBalancePaise)}
          </p>
        </div>
      </div>

      {/* Date Range Filter for Customer Ledger Statement */}
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        currentPreset={preset}
        onChange={(start: string | null, end: string | null, p: PeriodPreset) => {
          setStartDate(start)
          setEndDate(end)
          setPreset(p)
        }}
      />

      {/* Analytics for Selected Period */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Chuna Samay Maal (Debits)</span>
            <ArrowUpRight size={15} className="text-red-400" />
          </div>
          <p className="mt-1.5 text-base sm:text-lg font-bold text-red-400">
            + {formatPaiseAsRupees(statementAnalytics.periodDebits)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Purchases in Period</p>
        </div>

        <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Chuna Samay Jama (Credits)</span>
            <ArrowDownLeft size={15} className="text-green-400" />
          </div>
          <p className="mt-1.5 text-base sm:text-lg font-bold text-green-400">
            − {formatPaiseAsRupees(statementAnalytics.periodCredits)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Payments in Period</p>
        </div>

        <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Period Net Farak</span>
            <Wallet size={15} className="text-blue-400" />
          </div>
          <p className="mt-1.5 text-base sm:text-lg font-bold text-slate-900">
            {statementAnalytics.netChange >= 0 ? '+' : '−'}
            {formatPaiseAsRupees(Math.abs(statementAnalytics.netChange))}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {statementAnalytics.netChange > 0 ? 'Udhar Bada' : 'Udhar Kam Hua'}
          </p>
        </div>

        <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Parchiyan / Entries</span>
            <Coins size={15} className="text-amber-400" />
          </div>
          <p className="mt-1.5 text-base sm:text-lg font-bold text-slate-900">
            {statementAnalytics.count} Entries
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">In Selected Range</p>
        </div>
      </div>

      {/* Record a Payment / Jama Vasooli */}
      <Card className="flex flex-col gap-3 p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <PiggyBank size={18} className="text-green-400" />
          Khate me Jama Karein (Receive Payment)
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <Input
            label={t('bill.paymentAmount')}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Payment Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as PaymentMode)}
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-400"
            >
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m} className="bg-slate-100 text-slate-900">
                  {t(`bill.paymentMode.${m}`)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t('bill.notes')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Receipt #, Cheque #, GPay..."
          />
        </div>
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleRecordPayment} disabled={saving || !amount} className="font-bold text-xs">
            {saving ? <Spinner className="h-4 w-4" /> : 'Payment Jama Karein'}
          </Button>
        </div>
      </Card>

      {/* Filtered Ledger Table */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Khata Parchi Statement ({filteredRows.length})
          </h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Printer size={13} className="text-blue-400" />
            <span>Print Khata</span>
          </Button>
        </div>

        {filteredRows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
            Is chuni hui tareekh me koi len-den nahi hai (No transactions in selected range).
          </p>
        ) : (
          <LedgerTable rows={filteredRows} openingBalancePaise={openingBalancePaise} />
        )}
      </Card>
    </div>
  )
}
