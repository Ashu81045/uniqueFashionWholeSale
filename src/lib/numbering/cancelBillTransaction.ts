import { increment, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import {
  billDocRef,
  customerDocRef,
  dailyStatsDocRef,
  globalStatsDocRef,
  monthlyStatsDocRef,
} from '../../firebase/firestore'
import { GLOBAL_STATS_DOC_ID } from '../../types/globalStats'
import { toDateKey, toMonthKey } from '../utils/date'
import { aggregateCollectedByMode } from '../billing/paymentAggregation'

/**
 * Reverses a bill's contribution to the customer balance, the dailyStats/
 * monthlyStats docs for the day/month it was originally created, and the
 * global aggregates — then marks it cancelled. Same read-before-write
 * transactional shape as bill creation (see createBillTransaction.ts), just
 * subtracting instead of adding. Soft-delete only: the bill doc is kept
 * (status: 'cancelled'), never removed. Product-suggestion counts are NOT
 * reversed (best-effort/approximate by design — see productSuggestion.ts).
 */
export async function cancelBillTransaction(billId: string, cancelledByUid: string): Promise<void> {
  const billRef = billDocRef(billId)

  await runTransaction(db, async (tx) => {
    const billSnap = await tx.get(billRef)
    if (!billSnap.exists()) throw new Error('Bill not found.')
    const bill = billSnap.data()
    if (bill.status === 'cancelled') return // already cancelled, nothing to reverse

    const customerRef = customerDocRef(bill.customerId)
    const billDate = bill.createdAt.toDate()
    const dateKey = toDateKey(billDate)
    const monthKey = toMonthKey(billDate)
    const statsRef = dailyStatsDocRef(dateKey)
    const monthlyStatsRef = monthlyStatsDocRef(monthKey)
    const globalStatsRef = globalStatsDocRef(GLOBAL_STATS_DOC_ID)

    const [customerSnap, statsSnap, monthlyStatsSnap] = await Promise.all([
      tx.get(customerRef),
      tx.get(statsRef),
      tx.get(monthlyStatsRef),
    ])
    const collected = aggregateCollectedByMode(bill.paymentModes)

    tx.update(billRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledByUid,
    })

    if (customerSnap.exists()) {
      tx.update(customerRef, {
        outstandingBalancePaise: increment(-bill.dueAmountPaise),
        totalSpentPaise: increment(-bill.netPayableAmountPaise),
        billCount: increment(-1),
      })
    }

    if (statsSnap.exists()) {
      tx.update(statsRef, {
        totalSalesPaise: increment(-bill.netPayableAmountPaise),
        cashCollectedPaise: increment(-collected.cashCollectedPaise),
        upiCollectedPaise: increment(-collected.upiCollectedPaise),
        bankTransferCollectedPaise: increment(-collected.bankTransferCollectedPaise),
        otherCollectedPaise: increment(-collected.otherCollectedPaise),
        billCount: increment(-1),
        creditAmountPaise: increment(-bill.dueAmountPaise),
        lastUpdatedAt: serverTimestamp(),
      })
    }

    if (monthlyStatsSnap.exists()) {
      tx.update(monthlyStatsRef, {
        totalSalesPaise: increment(-bill.netPayableAmountPaise),
        cashCollectedPaise: increment(-collected.cashCollectedPaise),
        upiCollectedPaise: increment(-collected.upiCollectedPaise),
        bankTransferCollectedPaise: increment(-collected.bankTransferCollectedPaise),
        otherCollectedPaise: increment(-collected.otherCollectedPaise),
        billCount: increment(-1),
        creditAmountPaise: increment(-bill.dueAmountPaise),
        lastUpdatedAt: serverTimestamp(),
      })
    }

    tx.set(
      globalStatsRef,
      {
        totalOutstandingPaise: increment(-bill.dueAmountPaise),
        totalRevenuePaise: increment(-bill.netPayableAmountPaise),
        lastUpdatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  })
}
