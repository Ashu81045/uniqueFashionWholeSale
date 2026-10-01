import {
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import {
  dailyStatsDocRef,
  dayClosureDocRef,
  paymentsCollectionGroup,
} from '../../firebase/firestore'
import { fetchBillsPage } from '../bills/billsQuery'
import { toDateKey } from '../../lib/utils/date'
import type { DayClosure, CashDenominations, DayExpenseItem } from '../../types/dayClose'
import type { Bill } from '../../types/bill'
import type { DailyStats } from '../../types/dailyStats'
import type { UserRole } from '../../types/user'

/**
 * Extracts all candidate date keys (local & UTC) for a bill to prevent timezone mismatch.
 */
function extractBillDateKeys(bill: Bill): string[] {
  const keys: string[] = []

  const check = (ts: any) => {
    if (!ts) return
    const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts)
    if (!isNaN(d.getTime())) {
      keys.push(toDateKey(d))
      if (typeof d.toISOString === 'function') {
        keys.push(d.toISOString().slice(0, 10))
      }
    }
  }

  check(bill.createdAt)
  check(bill.date)

  return Array.from(new Set(keys))
}

export function getPreviousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const prev = new Date(y, m - 1, d)
  prev.setDate(prev.getDate() - 1)
  return toDateKey(prev)
}

/**
 * Safely fetches a day closure from local storage or Firestore without throwing permission errors.
 */
export async function getDayClosureSafe(dateKey: string): Promise<DayClosure | null> {
  // 1. Try local storage first (instant and 100% permission-safe)
  try {
    const raw = localStorage.getItem(`uf_day_closure_${dateKey}`)
    if (raw) {
      return JSON.parse(raw) as DayClosure
    }
  } catch {
    // Ignore JSON errors
  }

  // 2. Best-effort Firestore read with strict error catch
  try {
    const snap = await getDoc(dayClosureDocRef(dateKey))
    if (snap.exists()) {
      const data = snap.data()
      try {
        localStorage.setItem(`uf_day_closure_${dateKey}`, JSON.stringify(data))
      } catch {}
      return data
    }
  } catch {
    // Silently ignore permission-denied
  }

  return null
}

/**
 * Computes live or recorded metrics for a specific day.
 * Auto-links previous day's closing cash as opening cash float.
 * Subtracts cash expenses from expected cash drawer amount.
 */
export async function computeDayMetrics(
  dateKey: string,
  user?: { role: UserRole; uid: string },
): Promise<Omit<DayClosure, 'id'>> {
  // 1. Try reading existing saved closure
  const existingClosure = await getDayClosureSafe(dateKey)

  // 2. Check previous day closure to see if cash was left in drawer for today
  let autoOpeningCashPaise = 0
  if (!existingClosure || existingClosure.openingCashPaise === undefined) {
    const prevKey = getPreviousDateKey(dateKey)
    const prevClosure = await getDayClosureSafe(prevKey)
    if (prevClosure && typeof prevClosure.closingCashKeptPaise === 'number') {
      autoOpeningCashPaise = prevClosure.closingCashKeptPaise
    }
  }

  // 3. Read dailyStats for this date
  let dailyStats: DailyStats | null = null
  try {
    const dailySnap = await getDoc(dailyStatsDocRef(dateKey))
    if (dailySnap.exists()) {
      dailyStats = dailySnap.data()
    }
  } catch {
    // Graceful fallback
  }

  // 4. Fetch bills safely using the established fetchBillsPage query
  let dayBills: Bill[] = []
  if (user) {
    try {
      const page = await fetchBillsPage(user.role, user.uid, null)
      dayBills = page.bills.filter((b) => extractBillDateKeys(b).includes(dateKey))
    } catch {
      // Fallback to dailyStats if bills query restricted
    }
  }

  // 5. Query customer payments (past dues collected) made on this date
  let pastDuesCollectedPaise = 0
  let pastCashDuesPaise = 0
  try {
    const paySnap = await getDocs(query(paymentsCollectionGroup(), limit(100)))
    for (const doc of paySnap.docs) {
      const p = doc.data()
      if (p.createdAt) {
        const d = typeof p.createdAt.toDate === 'function' ? p.createdAt.toDate() : new Date(p.createdAt as any)
        if (!isNaN(d.getTime())) {
          const localKey = toDateKey(d)
          const utcKey = typeof d.toISOString === 'function' ? d.toISOString().slice(0, 10) : ''
          if (localKey === dateKey || utcKey === dateKey) {
            pastDuesCollectedPaise += p.amountPaise || 0
            if (p.mode === 'cash') {
              pastCashDuesPaise += p.amountPaise || 0
            }
          }
        }
      }
    }
  } catch {
    // Proceed if collection group restricted
  }

  let billCount = 0
  let cancelledBillCount = 0
  let totalItemsSold = 0
  let grossSalesPaise = 0
  let totalDiscountPaise = 0
  let roundOffPaise = 0
  let netSalesPaise = 0

  let cashCollectedPaise = 0
  let upiCollectedPaise = 0
  let bankTransferCollectedPaise = 0
  let otherCollectedPaise = 0
  let creditAmountPaise = 0

  if (dayBills.length > 0) {
    for (const bill of dayBills) {
      if (bill.status === 'cancelled') {
        cancelledBillCount++
        continue
      }

      billCount++
      grossSalesPaise += bill.totalProductAmountPaise || 0
      totalDiscountPaise += bill.totalDiscountPaise || 0
      roundOffPaise += bill.roundOffPaise || 0
      netSalesPaise += bill.netPayableAmountPaise || 0

      for (const item of bill.items || []) {
        totalItemsSold += item.qty || 1
      }

      for (const split of bill.paymentModes || []) {
        if (split.mode === 'cash') {
          cashCollectedPaise += split.amountPaise
        } else if (split.mode === 'upi' || split.mode === 'gpay' || split.mode === 'phonepe') {
          upiCollectedPaise += split.amountPaise
        } else if (split.mode === 'bank_transfer') {
          bankTransferCollectedPaise += split.amountPaise
        } else {
          otherCollectedPaise += split.amountPaise
        }
      }

      if (bill.dueAmountPaise && bill.dueAmountPaise > 0) {
        creditAmountPaise += bill.dueAmountPaise
      }
    }
  }

  // Cross-reference with dailyStats
  if (dailyStats) {
    if (billCount === 0 || (dailyStats.totalSalesPaise || 0) > netSalesPaise) {
      billCount = Math.max(billCount, dailyStats.billCount || 0)
      netSalesPaise = Math.max(netSalesPaise, dailyStats.totalSalesPaise || 0)
      grossSalesPaise = Math.max(grossSalesPaise, dailyStats.totalSalesPaise || 0)
      cashCollectedPaise = Math.max(cashCollectedPaise, dailyStats.cashCollectedPaise || 0)
      upiCollectedPaise = Math.max(upiCollectedPaise, dailyStats.upiCollectedPaise || 0)
      bankTransferCollectedPaise = Math.max(bankTransferCollectedPaise, dailyStats.bankTransferCollectedPaise || 0)
      otherCollectedPaise = Math.max(otherCollectedPaise, dailyStats.otherCollectedPaise || 0)
      creditAmountPaise = Math.max(creditAmountPaise, dailyStats.creditAmountPaise || 0)
    }
  }

  // Expenses calculations
  const expenses: DayExpenseItem[] = existingClosure?.expenses || []
  let totalCashExpensesPaise = 0
  let totalExpensesPaise = 0
  for (const exp of expenses) {
    totalExpensesPaise += exp.amountPaise || 0
    if (exp.mode === 'cash') {
      totalCashExpensesPaise += exp.amountPaise || 0
    }
  }

  const openingCashPaise = existingClosure?.openingCashPaise ?? autoOpeningCashPaise
  const totalCashInflow = cashCollectedPaise + pastCashDuesPaise
  // Expected cash in drawer = Opening Float + Cash Inflow - Cash Expenses
  const expectedCashPaise = Math.max(0, openingCashPaise + totalCashInflow - totalCashExpensesPaise)

  // Do NOT prepopulate actual cash if it wasn't explicitly saved before
  const actualCashPaise = existingClosure?.actualCashPaise ?? 0
  const cashDiscrepancyPaise = actualCashPaise - expectedCashPaise
  const closingCashKeptPaise = existingClosure?.closingCashKeptPaise ?? 0
  const cashWithdrawnPaise = existingClosure?.cashWithdrawnPaise ?? Math.max(0, actualCashPaise - closingCashKeptPaise)

  const totalCollectedPaise =
    cashCollectedPaise +
    upiCollectedPaise +
    bankTransferCollectedPaise +
    otherCollectedPaise +
    pastDuesCollectedPaise

  return {
    date: dateKey,
    status: existingClosure?.status ?? 'open',
    billCount,
    cancelledBillCount,
    totalItemsSold: totalItemsSold || billCount,
    grossSalesPaise,
    totalDiscountPaise,
    roundOffPaise,
    netSalesPaise,
    cashCollectedPaise,
    upiCollectedPaise,
    bankTransferCollectedPaise,
    otherCollectedPaise,
    totalCollectedPaise,
    creditAmountPaise,
    pastDuesCollectedPaise,
    expenses,
    totalCashExpensesPaise,
    totalExpensesPaise,
    openingCashPaise,
    expectedCashPaise,
    actualCashPaise,
    cashDiscrepancyPaise,
    closingCashKeptPaise,
    cashWithdrawnPaise,
    denominations: existingClosure?.denominations,
    notes: existingClosure?.notes ?? '',
    closedAt: existingClosure?.closedAt,
    closedByUid: existingClosure?.closedByUid,
    closedByName: existingClosure?.closedByName,
    closedByRole: existingClosure?.closedByRole,
  }
}

/**
 * Saves a DayClosure record. Always persists to local storage and attempts Firestore write.
 */
export async function saveDayClosure(
  closure: DayClosure,
  closeNow: boolean,
  user: { uid: string; name: string; role: any },
): Promise<DayClosure> {
  const now = Timestamp.now()

  const payload: DayClosure = {
    ...closure,
    status: closeNow ? 'closed' : closure.status,
    updatedAt: now,
  }

  if (closeNow) {
    payload.closedAt = now
    payload.closedByUid = user.uid
    payload.closedByName = user.name
    payload.closedByRole = user.role
  }

  // 1. Guaranteed storage in localStorage
  try {
    localStorage.setItem(`uf_day_closure_${closure.date}`, JSON.stringify(payload))
  } catch {
    // Ignore storage quota
  }

  // 2. Best-effort Firestore write
  try {
    await setDoc(dayClosureDocRef(closure.date), payload, { merge: true })
  } catch {
    // Ignore permissions or remote error
  }

  return payload
}

/**
 * Re-opens a closed day.
 */
export async function reopenDayClose(dateKey: string): Promise<void> {
  try {
    const raw = localStorage.getItem(`uf_day_closure_${dateKey}`)
    if (raw) {
      const data = JSON.parse(raw) as DayClosure
      data.status = 'open'
      localStorage.setItem(`uf_day_closure_${dateKey}`, JSON.stringify(data))
    }
  } catch {}

  try {
    await setDoc(
      dayClosureDocRef(dateKey),
      {
        status: 'open',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch {}
}
