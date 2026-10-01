import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  AlertCircle,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck2,
  HelpCircle,
  Lock,
  MinusCircle,
  Plus,
  Printer,
  QrCode,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  Unlock,
  Wallet,
} from 'lucide-react'
import { useT } from '../../i18n/I18nContext'
import { useAuthStore } from '../../stores/authStore'
import { formatPaiseAsRupees } from '../../lib/billing/formatCurrency'
import { formatDisplayDate, todayDateKey, toDateKey } from '../../lib/utils/date'
import {
  computeDayMetrics,
  saveDayClosure,
  reopenDayClose,
} from './dayCloseService'
import { DayClosePrintSlip } from './components/DayClosePrintSlip'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import type { DayClosure, CashDenominations, DayExpenseItem } from '../../types/dayClose'

export function DayClosePage() {
  const t = useT()
  const { date: paramDate } = useParams<{ date?: string }>()
  const session = useAuthStore((s) => s.session)

  const [selectedDate, setSelectedDate] = useState<string>(() => paramDate || todayDateKey())
  const [closure, setClosure] = useState<DayClosure | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // Reconciliation Inputs
  const [openingCashRupees, setOpeningCashRupees] = useState<string>('0')
  // Counted cash is deliberately NOT prepopulated so cashier counts and inputs
  const [actualCashRupees, setActualCashRupees] = useState<string>('')
  const [closingKeptRupees, setClosingKeptRupees] = useState<string>('0')
  const [notes, setNotes] = useState<string>('')

  // Expenses state
  const [expenses, setExpenses] = useState<DayExpenseItem[]>([])
  const [newExpenseTitle, setNewExpenseTitle] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newExpenseMode, setNewExpenseMode] = useState<'cash' | 'upi'>('cash')

  // Note Counter (Denominations) toggle & state
  const [showDenominations, setShowDenominations] = useState(false)
  const [denominations, setDenominations] = useState<CashDenominations>({
    c500: 0,
    c200: 0,
    c100: 0,
    c50: 0,
    c20: 0,
    c10: 0,
    coins: 0,
  })

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)

  const isToday = selectedDate === todayDateKey()

  const yesterdayKey = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return toDateKey(d)
  }, [])

  async function loadData(targetDate: string) {
    setLoading(true)
    try {
      const userParam = session ? { role: session.role, uid: session.uid } : undefined
      const data = await computeDayMetrics(targetDate, userParam)
      setClosure({ id: targetDate, ...data })

      const opRupees = (data.openingCashPaise || 0) / 100
      setOpeningCashRupees(String(opRupees))

      // Only set actualCashRupees if it was explicitly previously saved and closed/drafted
      if (data.status === 'closed' || (data.actualCashPaise && data.actualCashPaise > 0)) {
        setActualCashRupees(String(data.actualCashPaise / 100))
      } else {
        setActualCashRupees('')
      }

      const keptRupees = (data.closingCashKeptPaise || 0) / 100
      setClosingKeptRupees(String(keptRupees))

      setNotes(data.notes || '')
      if (data.denominations) {
        setDenominations(data.denominations)
      }
      if (data.expenses) {
        setExpenses(data.expenses)
      } else {
        setExpenses([])
      }
    } catch (err) {
      console.error('Failed to load day metrics', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedDate)
  }, [selectedDate, session?.uid])

  // Denominations calculator helper
  function updateDenomination(key: keyof CashDenominations, count: number) {
    const next = { ...denominations, [key]: Math.max(0, count) }
    setDenominations(next)

    // Calculate total from denominations
    const total =
      (next.c500 || 0) * 500 +
      (next.c200 || 0) * 200 +
      (next.c100 || 0) * 100 +
      (next.c50 || 0) * 50 +
      (next.c20 || 0) * 20 +
      (next.c10 || 0) * 10 +
      (next.coins || 0)

    setActualCashRupees(String(total))
  }

  // Expense Handlers
  function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = parseFloat(newExpenseAmount)
    if (!newExpenseTitle.trim() || isNaN(amountNum) || amountNum <= 0) return

    const item: DayExpenseItem = {
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: newExpenseTitle.trim(),
      amountPaise: Math.round(amountNum * 100),
      mode: newExpenseMode,
    }

    setExpenses((prev) => [...prev, item])
    setNewExpenseTitle('')
    setNewExpenseAmount('')
  }

  function handleRemoveExpense(id: string) {
    setExpenses((prev) => prev.filter((item) => item.id !== id))
  }

  // Expenses totals
  const totalCashExpensesPaise = useMemo(() => {
    return expenses
      .filter((e) => e.mode === 'cash')
      .reduce((sum, e) => sum + e.amountPaise, 0)
  }, [expenses])

  const totalAllExpensesPaise = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amountPaise, 0)
  }, [expenses])

  // Calculated cash drawer values
  const openingPaise = Math.round((Number(openingCashRupees) || 0) * 100)
  const isActualCashEntered = actualCashRupees.trim() !== ''
  const actualPaise = isActualCashEntered ? Math.round(Number(actualCashRupees) * 100) : 0

  const cashInflowPaise = (closure?.cashCollectedPaise || 0) + (closure?.pastDuesCollectedPaise || 0)
  // Expected = Opening Float + Inflow - Cash Expenses from drawer
  const expectedPaise = Math.max(0, openingPaise + cashInflowPaise - totalCashExpensesPaise)
  const discrepancyPaise = actualPaise - expectedPaise

  const closingKeptPaise = Math.round((Number(closingKeptRupees) || 0) * 100)
  const cashWithdrawnPaise = Math.max(0, actualPaise - closingKeptPaise)

  async function handleSaveDraft() {
    if (!closure || !session) return
    setSaving(true)
    try {
      const updated: DayClosure = {
        ...closure,
        openingCashPaise: openingPaise,
        expectedCashPaise: expectedPaise,
        actualCashPaise: actualPaise,
        cashDiscrepancyPaise: discrepancyPaise,
        closingCashKeptPaise: closingKeptPaise,
        cashWithdrawnPaise: cashWithdrawnPaise,
        expenses,
        totalCashExpensesPaise,
        totalExpensesPaise: totalAllExpensesPaise,
        denominations,
        notes,
      }
      const saved = await saveDayClosure(updated, false, {
        uid: session.uid,
        name: session.name,
        role: session.role,
      })
      setClosure(saved)
      setNotice('Hisaab draft safaltapoorvak save ho gaya (Draft saved).')
      setTimeout(() => setNotice(null), 3500)
    } finally {
      setSaving(false)
    }
  }

  async function handleFinalizeClosure() {
    if (!closure || !session) return
    if (!isActualCashEntered) {
      alert('Kripya gulle ka cash gin kar pehle daliye (Please enter counted cash from counter).')
      return
    }
    setSaving(true)
    try {
      const updated: DayClosure = {
        ...closure,
        openingCashPaise: openingPaise,
        expectedCashPaise: expectedPaise,
        actualCashPaise: actualPaise,
        cashDiscrepancyPaise: discrepancyPaise,
        closingCashKeptPaise: closingKeptPaise,
        cashWithdrawnPaise: cashWithdrawnPaise,
        expenses,
        totalCashExpensesPaise,
        totalExpensesPaise: totalAllExpensesPaise,
        denominations,
        notes,
      }
      const saved = await saveDayClosure(updated, true, {
        uid: session.uid,
        name: session.name,
        role: session.role,
      })
      setClosure(saved)
      setShowConfirmModal(false)
      setNotice(`Gulla band kar diya gaya (${closure.date}). Day closed successfully!`)
      setTimeout(() => setNotice(null), 4000)
    } finally {
      setSaving(false)
    }
  }

  async function handleReopen() {
    if (!closure) return
    setSaving(true)
    try {
      await reopenDayClose(closure.date)
      await loadData(closure.date)
      setNotice(`Gulla dobara khol diya gaya (${closure.date}). You can edit now.`)
      setTimeout(() => setNotice(null), 3500)
    } finally {
      setSaving(false)
    }
  }

  const isClosed = closure?.status === 'closed'

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 bg-slate-100 p-5 rounded-2xl shadow-sm shadow-black/20">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <FileCheck2 size={26} className="text-blue-400" />
              Day Close & Gulla Hisaab
            </h1>
            {isClosed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-950 text-green-300 border border-green-700/60 shadow-xs">
                <Lock size={13} />
                Gulla Band (Closed)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700/60 shadow-xs">
                <Unlock size={13} />
                Gulla Chalu (Open)
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Rozana cash, UPI, dukan ke kharche aur gulle ka farak (Difference) check karein.
          </p>
        </div>

        {/* Date Selector toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedDate(todayDateKey())}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isToday
                  ? 'bg-blue-600 text-slate-50 shadow-sm'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-200/50'
              }`}
            >
              Aaj (Today)
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayKey)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedDate === yesterdayKey
                  ? 'bg-blue-600 text-slate-50 shadow-sm'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-200/50'
              }`}
            >
              Kal (Yesterday)
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-400"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadData(selectedDate)}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 font-semibold"
            disabled={!closure}
          >
            <Printer size={15} className="text-blue-400" />
            <span>Parchi Print</span>
          </Button>
        </div>
      </div>

      {/* Notification banner */}
      {notice && (
        <div className="flex animate-fade-in items-center gap-2 rounded-xl bg-blue-950/60 border border-blue-400/40 p-4 text-sm font-semibold text-blue-200 shadow-md">
          <CheckCircle2 size={18} className="text-blue-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Closed Banner */}
      {isClosed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-500/50 bg-green-950/40 p-4 text-green-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-slate-50 shadow-md">
              <Lock size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-green-100">
                Is din ka gulla band kar diya gaya hai (Register Closed on {closure?.date})
              </p>
              <p className="text-xs text-green-300 mt-0.5">
                Band kiya: <strong className="text-slate-100">{closure?.closedByName || 'Staff'}</strong> ({closure?.closedByRole})
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleReopen}
            disabled={saving}
            className="text-xs font-bold text-green-300 bg-green-900/40 hover:bg-green-900/70 border border-green-500/40"
          >
            <Unlock size={14} />
            <span>Dobara Chalu Karein (Reopen)</span>
          </Button>
        </div>
      )}

      {loading && !closure ? (
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      ) : closure ? (
        <>
          {/* TOP HIGHLIGHT ROW: PROMINENT UPI & CASH INFLOW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. PROMINENT UPI CARD */}
            <div className="bg-slate-100 p-6 rounded-2xl border-2 border-blue-400 shadow-md shadow-black/25 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-950/80 border border-blue-400/40 px-3 py-1 rounded-md">
                    <QrCode size={16} className="text-blue-400" />
                    Online / UPI Jama (Today)
                  </span>
                  <span className="text-[11px] font-semibold text-blue-200 bg-blue-900/40 border border-blue-700/50 px-2.5 py-0.5 rounded-full">
                    GPay • PhonePe • QR
                  </span>
                </div>
                <p className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {formatPaiseAsRupees(closure.upiCollectedPaise)}
                </p>
              </div>
              <p className="text-xs font-medium text-slate-300 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                📱 Apne counter ke <strong className="text-slate-100">QR stand, Soundbox ya Bank account</strong> se yeh rakam match karein.
              </p>
            </div>

            {/* 2. CASH INFLOW CARD */}
            <div className="bg-slate-100 p-6 rounded-2xl border-2 border-green-500 shadow-md shadow-black/25 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-300 bg-green-950/80 border border-green-400/40 px-3 py-1 rounded-md">
                    <Coins size={16} className="text-green-400" />
                    Cash me Bikri + Vasooli
                  </span>
                  <span className="text-[11px] font-semibold text-green-200 bg-green-900/40 border border-green-700/50 px-2.5 py-0.5 rounded-full">
                    Counter Cash
                  </span>
                </div>
                <p className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {formatPaiseAsRupees(cashInflowPaise)}
                </p>
              </div>
              <p className="text-xs font-medium text-slate-300 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                💵 Aaj cash bills: <strong className="text-slate-100">{formatPaiseAsRupees(closure.cashCollectedPaise)}</strong>
                {closure.pastDuesCollectedPaise > 0 && ` + Purani vasooli: ${formatPaiseAsRupees(closure.pastDuesCollectedPaise)}`}
              </p>
            </div>
          </div>

          {/* 4 SUMMARY STAT CARDS */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kul Net Bikri</span>
                <TrendingUp size={16} className="text-blue-400" />
              </div>
              <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">
                {formatPaiseAsRupees(closure.netSalesPaise)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Gross: {formatPaiseAsRupees(closure.grossSalesPaise)}
              </p>
            </div>

            <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kul Bills</span>
                <Receipt size={16} className="text-green-400" />
              </div>
              <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">
                {closure.billCount} Parchi
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {closure.totalItemsSold} Piece Bika
              </p>
            </div>

            <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kul Jama (Total)</span>
                <Wallet size={16} className="text-amber-400" />
              </div>
              <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">
                {formatPaiseAsRupees(closure.totalCollectedPaise)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Cash + UPI mila kar
              </p>
            </div>

            <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Naya Udhar (Credit)</span>
                <Clock size={16} className="text-red-400" />
              </div>
              <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">
                {formatPaiseAsRupees(closure.creditAmountPaise)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Grahako par baaki
              </p>
            </div>
          </div>

          {/* DUKAN KE KHARCHE (EXPENSES FROM COUNTER) */}
          <div className="p-5 sm:p-6 bg-slate-100 border border-slate-200 rounded-2xl shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MinusCircle size={20} className="text-red-400" />
                  Dukan ke Rozana Kharche (Counter Cash Expenses)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chai, tempo, hamali, packing ya anya kharche jo counter gulle se diye gaye.
                </p>
              </div>

              {totalCashExpensesPaise > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/70 border border-red-500/50 text-xs font-bold text-red-200">
                  <span>Gulle se Kul Kharche:</span>
                  <span className="text-sm font-extrabold text-red-300">
                    - {formatPaiseAsRupees(totalCashExpensesPaise)}
                  </span>
                </div>
              )}
            </div>

            {/* Expense Add Form */}
            {!isClosed && (
              <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="sm:col-span-5 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Kharcha Kisme Hua? (Reason)
                  </label>
                  <input
                    type="text"
                    value={newExpenseTitle}
                    onChange={(e) => setNewExpenseTitle(e.target.value)}
                    placeholder="Jaise: Chai-Nashta, Tempo Bhada, Majdoori, Tape..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Rakam (₹ Amount)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Payment Mode
                  </label>
                  <select
                    value={newExpenseMode}
                    onChange={(e) => setNewExpenseMode(e.target.value as 'cash' | 'upi')}
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-400 focus:outline-none"
                  >
                    <option value="cash">💵 Cash (Gulle se)</option>
                    <option value="upi">📱 Online (UPI)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full font-bold text-xs py-2 h-[38px] flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Plus size={15} />
                    <span>Jodein</span>
                  </Button>
                </div>
              </form>
            )}

            {/* Expenses List */}
            {expenses.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Aaj koi kharcha darj nahi hai (No expenses added yet).
              </p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                {expenses.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3.5 text-xs">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                          item.mode === 'cash'
                            ? 'bg-amber-950 text-amber-300 border border-amber-600/50'
                            : 'bg-blue-950 text-blue-300 border border-blue-600/50'
                        }`}
                      >
                        {item.mode === 'cash' ? '💵 Cash Gulla' : '📱 UPI'}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-red-400 text-sm">
                        - {formatPaiseAsRupees(item.amountPaise)}
                      </span>
                      {!isClosed && (
                        <button
                          type="button"
                          onClick={() => handleRemoveExpense(item.id)}
                          className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                          title="Hataiye"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MAIN SECTION: GULLA HISAAB & DETAILED FARAK */}
          <div className="p-6 bg-slate-100 border-2 border-amber-400/70 rounded-3xl shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Coins size={22} className="text-amber-400" />
                  Gulla Hisaab & Farak (Drawer Counting & Reconciliation)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Counter gulle ka cash ginein aur yahan likhein — system hisaab se farak apne aap dikh jayega.
                </p>
              </div>

              {/* Realtime Difference Badge */}
              {isActualCashEntered ? (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md ${
                    discrepancyPaise === 0
                      ? 'bg-green-950 text-green-300 border-2 border-green-500'
                      : discrepancyPaise > 0
                      ? 'bg-amber-950 text-amber-300 border-2 border-amber-500'
                      : 'bg-red-950 text-red-300 border-2 border-red-500'
                  }`}
                >
                  {discrepancyPaise === 0 ? (
                    <>
                      <CheckCircle2 size={18} className="text-green-400" />
                      <span className="text-sm">✓ Gulla Barabar (₹0 Farak)</span>
                    </>
                  ) : discrepancyPaise > 0 ? (
                    <>
                      <span className="text-sm">▲ Extra Cash: +{formatPaiseAsRupees(discrepancyPaise)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">▼ Cash Kam Hai (Shortage): -{formatPaiseAsRupees(Math.abs(discrepancyPaise))}</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-amber-500/60 text-xs font-bold text-amber-300">
                  <span>⚠️ Gulle ka cash gin kar daliye</span>
                </div>
              )}
            </div>

            {/* STEP-BY-STEP CALCULATION AUDIT BOX */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <HelpCircle size={16} className="text-blue-400" />
                Hisaab kaise bana aur Farak (Difference) kaise nikla?
              </h3>

              <div className="grid gap-2 text-xs sm:text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-200/80">
                  <span className="text-slate-300">
                    1. Gulle me Subah ka Cash (Opening Float):
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatPaiseAsRupees(openingPaise)}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200/80">
                  <span className="text-slate-300">
                    2. (+) Aaj ki Cash Bikri & Vasooli (Cash Inflow):
                  </span>
                  <span className="font-bold text-green-400">
                    + {formatPaiseAsRupees(cashInflowPaise)}
                  </span>
                </div>

                {totalCashExpensesPaise > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-slate-200/80">
                    <span className="text-red-300">
                      3. (-) Dukan ke Cash Kharche (Cash Expenses):
                    </span>
                    <span className="font-bold text-red-400">
                      - {formatPaiseAsRupees(totalCashExpensesPaise)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-2.5 border-y border-slate-300 font-bold bg-slate-100 px-3.5 rounded-xl shadow-xs">
                  <span className="text-slate-200">
                    (=) Gulle me hona chahiye (Expected System Cash):
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-blue-400">
                    {formatPaiseAsRupees(expectedPaise)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-200 font-bold px-3.5">
                  <span className="text-slate-200">
                    (~) Asli gin kar mila (Actual Counted Cash):
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    {isActualCashEntered ? formatPaiseAsRupees(actualPaise) : '— Abhi gin kar daliye —'}
                  </span>
                </div>

                {isActualCashEntered && (
                  <div
                    className={`flex justify-between py-3 px-3.5 rounded-xl font-bold text-sm mt-1 border-2 ${
                      discrepancyPaise === 0
                        ? 'bg-green-950/80 text-green-300 border-green-500'
                        : discrepancyPaise > 0
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500'
                        : 'bg-red-950/80 text-red-300 border-red-500'
                    }`}
                  >
                    <span>
                      Farak (Difference = Counted - Expected):
                    </span>
                    <span>
                      {discrepancyPaise === 0
                        ? '₹0 (Bilkul Barabar ✓)'
                        : discrepancyPaise > 0
                        ? `+${formatPaiseAsRupees(discrepancyPaise)} (Gulle me itna cash EXTRA mila)`
                        : `-${formatPaiseAsRupees(Math.abs(discrepancyPaise))} (Gulle me itna cash KAM mila)`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* INPUTS: OPENING CASH & ACTUAL CASH */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* 1. Opening Cash */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  1. Subah ka Cash / Gulle ka Khulla (Opening Float ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={isClosed}
                    value={openingCashRupees}
                    onChange={(e) => setOpeningCashRupees(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-8 pr-3 text-base font-bold text-slate-900 focus:border-blue-400 focus:outline-none disabled:opacity-75"
                    placeholder="0"
                  />
                </div>
                <span className="text-xs text-slate-400">
                  Dukan kholte samay gulle me rakha cash
                </span>
              </div>

              {/* 2. Counted Cash (NOT prepopulated - highlighted) */}
              <div className="flex flex-col gap-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-300">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                    2. Gin kar mila Cash (Counted from Drawer ₹) *
                  </label>
                  {!isClosed && (
                    <button
                      type="button"
                      onClick={() => setShowDenominations(!showDenominations)}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 underline underline-offset-2"
                    >
                      <Calculator size={14} />
                      {showDenominations ? 'Band Karein' : 'Note Ginti (500, 200, 100...)'}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={isClosed}
                    value={actualCashRupees}
                    onChange={(e) => setActualCashRupees(e.target.value)}
                    className={`w-full rounded-xl border-2 py-3 pl-8 pr-3 text-base font-bold focus:outline-none ${
                      isActualCashEntered
                        ? 'border-blue-500 bg-slate-100 text-slate-900'
                        : 'border-amber-400 bg-slate-100 text-slate-900 placeholder:text-slate-500'
                    }`}
                    placeholder="Gulle ka cash gin kar daliye"
                  />
                </div>
                <span className="text-xs font-semibold text-blue-300">
                  {isActualCashEntered
                    ? '✓ Cash enter ho chuka hai'
                    : '👉 Abhi gulle me jitne cash notes aur sikke hain unko gin kar yahan likhein'}
                </span>
              </div>
            </div>

            {/* DENOMINATIONS NOTE COUNTER (IF TOGGLED) */}
            {showDenominations && !isClosed && (
              <div className="mt-5 p-5 rounded-2xl border border-blue-400/40 bg-slate-50 animate-fade-in">
                <p className="text-xs font-bold text-blue-300 mb-3.5 flex items-center gap-1.5 uppercase">
                  <Calculator size={16} className="text-blue-400" />
                  Note Ginti Calculator (Denomination Notes Counter)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { key: 'c500', note: '₹500 ke Note' },
                    { key: 'c200', note: '₹200 ke Note' },
                    { key: 'c100', note: '₹100 ke Note' },
                    { key: 'c50', note: '₹50 ke Note' },
                    { key: 'c20', note: '₹20 ke Note' },
                    { key: 'c10', note: '₹10 ke Note' },
                  ].map(({ key, note }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <span className="text-slate-300 font-semibold">{note}:</span>
                      <input
                        type="number"
                        min="0"
                        value={denominations[key as keyof CashDenominations] || ''}
                        onChange={(e) =>
                          updateDenomination(
                            key as keyof CashDenominations,
                            parseInt(e.target.value) || 0,
                          )
                        }
                        placeholder="0"
                        className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  ))}

                  <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-2">
                    <span className="text-slate-300 font-semibold">Chhutta Sikke (Coins Kul Rakam ₹):</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations.coins || ''}
                      onChange={(e) =>
                        updateDenomination('coins', parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CASH TO LEAVE FOR TOMORROW (NEXT DAY OPENING FLOAT) */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Kal ke liye Cash & Jama (Leave Cash for Tomorrow)
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Kal Subah ke liye Gulle me chhoda Cash (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={actualPaise / 100}
                      step="1"
                      disabled={isClosed}
                      value={closingKeptRupees}
                      onChange={(e) => setClosingKeptRupees(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-100 py-2.5 pl-8 pr-3 text-sm font-bold text-slate-900 focus:border-blue-400 focus:outline-none disabled:opacity-75"
                      placeholder="0"
                    />
                  </div>
                  <span className="text-xs text-blue-300">
                    Yeh rakam kal subah gulle ka Opening Cash apne aap ban jayegi.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Ghar ya Bank le jane wala Cash (Withdraw / Deposit)
                  </label>
                  <div className="rounded-xl border border-green-500/40 bg-green-950/40 py-2.5 px-3.5 text-base sm:text-lg font-bold text-green-300">
                    {formatPaiseAsRupees(cashWithdrawnPaise)}
                  </div>
                  <span className="text-xs text-slate-400">
                    Kul cash ({formatPaiseAsRupees(actualPaise)}) - Kal ke liye chhoda ({formatPaiseAsRupees(closingKeptPaise)})
                  </span>
                </div>
              </div>
            </div>

            {/* Remarks / Notes */}
            <div className="mt-5 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Munshi / Staff Note ya Remarks
              </label>
              <textarea
                rows={2}
                disabled={isClosed}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agar cash me koi farak hai ya bank jama ki jankari ho toh yahan likhein..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none disabled:opacity-75"
              />
            </div>

            {/* Action Buttons */}
            {!isClosed && (
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="text-xs font-semibold"
                >
                  {saving ? <Spinner className="h-4 w-4" /> : 'Hisaab Save Karein (Draft)'}
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={saving || !isActualCashEntered}
                  className="flex items-center gap-2 text-xs font-bold shadow-md"
                >
                  <Lock size={15} />
                  <span>Din Band Karein & Lock Karein (Close Day)</span>
                </Button>
              </div>
            )}
          </div>

          {/* Sales Breakdown & Collections by Mode */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Sales Breakdown */}
            <div className="p-5 sm:p-6 bg-slate-100 border border-slate-200 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <ShoppingBag size={18} className="text-blue-400" />
                Bikri aur Chhoot ka Hisaab (Sales & Discounts)
              </h2>

              <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-400">Kul Maal ki Kimat (Gross Sales)</span>
                  <span className="font-bold text-slate-900">
                    {formatPaiseAsRupees(closure.grossSalesPaise)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-400">Kul Di Gayi Chhoot (Total Discount)</span>
                  <span className="font-bold text-green-400">
                    - {formatPaiseAsRupees(closure.totalDiscountPaise)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-400">Round Off Adjustment</span>
                  <span className="font-bold text-slate-300">
                    {formatPaiseAsRupees(closure.roundOffPaise)}
                  </span>
                </div>

                <div className="flex justify-between py-3 border-y border-slate-300 bg-slate-50 px-3.5 rounded-xl font-bold">
                  <span className="text-slate-200">Net Bikri Rakam (Net Sales)</span>
                  <span className="text-blue-400 text-base">
                    {formatPaiseAsRupees(closure.netSalesPaise)}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-slate-400">
                  <span>Radd Bills (Cancelled)</span>
                  <span>{closure.cancelledBillCount}</span>
                </div>
              </div>
            </div>

            {/* Payment Modes Breakdown */}
            <div className="p-5 sm:p-6 bg-slate-100 border border-slate-200 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Coins size={18} className="text-amber-400" />
                Payment Mode ke Hisaab se Jama (Collections)
              </h2>

              <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="flex items-center gap-2 text-slate-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    Cash me Bikri (Cash Bills)
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatPaiseAsRupees(closure.cashCollectedPaise)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-200 bg-blue-950/40 px-3 rounded-lg">
                  <span className="flex items-center gap-2 font-bold text-blue-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                    UPI / QR (GPay, PhonePe, Paytm)
                  </span>
                  <span className="font-bold text-blue-300">
                    {formatPaiseAsRupees(closure.upiCollectedPaise)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="flex items-center gap-2 text-slate-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                    Bank Transfer / Card
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatPaiseAsRupees(closure.bankTransferCollectedPaise)}
                  </span>
                </div>

                {closure.otherCollectedPaise > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-400">Anya Mode</span>
                    <span className="font-bold text-slate-900">
                      {formatPaiseAsRupees(closure.otherCollectedPaise)}
                    </span>
                  </div>
                )}

                {closure.pastDuesCollectedPaise > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-200 text-blue-200 bg-blue-950/40 px-3 rounded-lg">
                    <span className="font-semibold">
                      + Purani Udhar Vasooli (Past Dues Received)
                    </span>
                    <span className="font-bold text-blue-300">
                      {formatPaiseAsRupees(closure.pastDuesCollectedPaise)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-3 border-y border-slate-300 bg-slate-50 px-3.5 rounded-xl font-bold">
                  <span className="text-slate-200">Kul Jama Rakam (Total Inflow)</span>
                  <span className="text-green-400 text-base">
                    {formatPaiseAsRupees(closure.totalCollectedPaise)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Confirmation Modal */}
      {showConfirmModal && closure && (
        <Modal
          title="Din Band Karne ki Pushti Karein (Confirm Day Close)"
          onClose={() => setShowConfirmModal(false)}
          size="md"
        >
          <div className="flex flex-col gap-4 text-xs sm:text-sm text-slate-300">
            <p className="text-slate-300">
              Kya aap tareekh <strong className="text-slate-100">{closure.date}</strong> ka din band karke register lock karna chahte hain?
            </p>

            <div className="rounded-xl bg-slate-50 p-4 flex flex-col gap-2.5 border border-slate-200 font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400">Kul Bills:</span>
                <span className="font-bold text-slate-900">{closure.billCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Net Bikri:</span>
                <span className="font-bold text-slate-900">
                  {formatPaiseAsRupees(closure.netSalesPaise)}
                </span>
              </div>
              <div className="flex justify-between text-blue-300">
                <span>Online / UPI Jama:</span>
                <span className="font-bold text-blue-200">
                  {formatPaiseAsRupees(closure.upiCollectedPaise)}
                </span>
              </div>
              {totalCashExpensesPaise > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Dukan ke Cash Kharche:</span>
                  <span className="font-bold">
                    - {formatPaiseAsRupees(totalCashExpensesPaise)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 border-t border-slate-200">
                <span className="text-slate-400">Gulle me hona chahiye:</span>
                <span className="font-bold text-blue-400">
                  {formatPaiseAsRupees(expectedPaise)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gulle me mila cash:</span>
                <span className="font-bold text-slate-900">
                  {formatPaiseAsRupees(actualPaise)}
                </span>
              </div>
              <div
                className={`flex justify-between pt-2 border-t border-slate-200 font-bold text-sm ${
                  discrepancyPaise === 0
                    ? 'text-green-400'
                    : discrepancyPaise > 0
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                <span>Farak (Discrepancy):</span>
                <span>
                  {discrepancyPaise === 0
                    ? '₹0 (Barabar)'
                    : (discrepancyPaise > 0 ? '+' : '-') + formatPaiseAsRupees(Math.abs(discrepancyPaise))}
                </span>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-200 text-blue-300">
                <span>Kal subah ke liye chhoda cash:</span>
                <span className="font-bold text-slate-100">{formatPaiseAsRupees(closingKeptPaise)}</span>
              </div>
              <div className="flex justify-between font-bold text-green-300 text-sm">
                <span>Bank / Ghar le jane wala cash:</span>
                <span>{formatPaiseAsRupees(cashWithdrawnPaise)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleFinalizeClosure}
                disabled={saving}
                className="flex items-center gap-1.5 font-bold"
              >
                {saving ? <Spinner tone="dark" className="h-4 w-4" /> : <Lock size={15} />}
                <span>Haan, Gulla Band Karein</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Closure Slip Modal */}
      {showPrintModal && closure && (
        <Modal
          title={`Rozana Day Close Parchi (${closure.date})`}
          onClose={() => setShowPrintModal(false)}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            <div className="flex justify-end gap-2 pb-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => window.print()}
                className="flex items-center gap-1.5"
              >
                <Printer size={15} />
                <span>Parchi Print Karein / PDF</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowPrintModal(false)}
              >
                Band Karein
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[70vh] border border-slate-300 rounded-2xl p-4 bg-slate-50">
              <DayClosePrintSlip
                closure={{
                  ...closure,
                  openingCashPaise: openingPaise,
                  expectedCashPaise: expectedPaise,
                  actualCashPaise: actualPaise,
                  closingCashKeptPaise: closingKeptPaise,
                  cashWithdrawnPaise: cashWithdrawnPaise,
                  expenses,
                  totalCashExpensesPaise,
                  totalExpensesPaise: totalAllExpensesPaise,
                  notes,
                }}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
