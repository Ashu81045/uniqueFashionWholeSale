import {
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import {
  billsCol,
  customerDocRef,
  customerPaymentsCol,
  globalStatsDocRef,
} from '../../firebase/firestore'
import { GLOBAL_STATS_DOC_ID } from '../../types/globalStats'
import type { PaymentMode } from '../../types/payment'
import type { UserRole } from '../../types/user'

const LEDGER_PAGE_SIZE = 50

export interface LedgerRow {
  date: Date
  billNo: number | null
  debitPaise: number
  creditPaise: number
  remarks: string
}

/**
 * Merges recent bills (debits) and payments (credits) for one customer into
 * ledger rows with a running balance. Bounded to the most recent 50 of each
 * to keep reads cheap — the authoritative total is customer.outstandingBalancePaise,
 * shown separately; this table is a recent-activity view, not full history.
 */
export async function fetchCustomerLedger(customerId: string): Promise<LedgerRow[]> {
  const billsQuery = query(
    billsCol(),
    where('customerId', '==', customerId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(LEDGER_PAGE_SIZE),
  )
  const paymentsQuery = query(
    customerPaymentsCol(customerId),
    orderBy('createdAt', 'desc'),
    limit(LEDGER_PAGE_SIZE),
  )

  const [billsSnap, paymentsSnap] = await Promise.all([getDocs(billsQuery), getDocs(paymentsQuery)])

  const billRows: LedgerRow[] = billsSnap.docs.map((d) => {
    const bill = d.data()
    return {
      date: bill.createdAt?.toDate?.() ?? new Date(),
      billNo: bill.billNo,
      debitPaise: bill.dueAmountPaise,
      creditPaise: 0,
      remarks: `Bill #${bill.billNo}`,
    }
  })

  const paymentRows: LedgerRow[] = paymentsSnap.docs.map((d) => {
    const payment = d.data()
    return {
      date: payment.createdAt?.toDate?.() ?? new Date(),
      billNo: null,
      debitPaise: 0,
      creditPaise: payment.amountPaise,
      remarks: payment.note || `Payment (${payment.mode})`,
    }
  })

  return [...billRows, ...paymentRows].sort((a, b) => a.date.getTime() - b.date.getTime())
}

export async function recordPayment(
  customerId: string,
  amountPaise: number,
  mode: PaymentMode,
  note: string,
  createdByUid: string,
  createdByRole: UserRole,
): Promise<void> {
  const batch = writeBatch(db)
  const paymentRef = doc(customerPaymentsCol(customerId))

  batch.set(paymentRef, {
    id: paymentRef.id,
    amountPaise,
    mode,
    note,
    createdAt: serverTimestamp(),
    createdByUid,
    createdByRole,
  })
  batch.update(customerDocRef(customerId), {
    outstandingBalancePaise: increment(-amountPaise),
  })
  batch.set(
    globalStatsDocRef(GLOBAL_STATS_DOC_ID),
    { totalOutstandingPaise: increment(-amountPaise), lastUpdatedAt: serverTimestamp() },
    { merge: true },
  )

  await batch.commit()
}
