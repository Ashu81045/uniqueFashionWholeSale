import { doc, increment, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import {
  billsCol,
  counterDocRef,
  customerDocRef,
  dailyStatsDocRef,
  globalStatsDocRef,
  monthlyStatsDocRef,
} from '../../firebase/firestore'
import { BILL_COUNTER_DOC_ID } from '../../types/counter'
import { GLOBAL_STATS_DOC_ID } from '../../types/globalStats'
import { todayDateKey, currentMonthKey } from '../utils/date'
import { aggregateCollectedByMode } from '../billing/paymentAggregation'
import type { BillCalculationResult } from '../billing/calculateBill'
import type { Bill, BillPaymentModeSplit, PaymentStatus } from '../../types/bill'
import type { UserRole } from '../../types/user'

export interface CreateBillInput {
  calculation: BillCalculationResult
  customerId: string // mobile
  customerName: string
  customerMobile: string
  paymentStatus: PaymentStatus
  amountPaidPaise: number
  paymentModes: BillPaymentModeSplit[]
  createdByUid: string
  createdByRole: UserRole
}

/**
 * Atomically: bumps the sequential bill counter, writes the bill doc, updates
 * the customer's running balance, and rolls the bill into today's dailyStats
 * aggregate doc. All reads happen before any writes (Firestore transaction
 * requirement). See plan doc §"Bill Save — Atomic Transaction" for the full
 * read/write budget (well under the 500-op transaction limit).
 */
export async function createBillTransaction(input: CreateBillInput): Promise<Bill> {
  const { calculation } = input
  const dueAmountPaise = calculation.netPayableAmountPaise - input.amountPaidPaise
  const dateKey = todayDateKey()
  const monthKey = currentMonthKey()
  const billRef = doc(billsCol())
  const counterRef = counterDocRef(BILL_COUNTER_DOC_ID)
  const customerRef = customerDocRef(input.customerId)
  const statsRef = dailyStatsDocRef(dateKey)
  const monthlyStatsRef = monthlyStatsDocRef(monthKey)
  const globalStatsRef = globalStatsDocRef(GLOBAL_STATS_DOC_ID)
  const collected = aggregateCollectedByMode(input.paymentModes)

  const bill = await runTransaction(db, async (tx) => {
    const [counterSnap, customerSnap, statsSnap, monthlyStatsSnap] = await Promise.all([
      tx.get(counterRef),
      tx.get(customerRef),
      tx.get(statsRef),
      tx.get(monthlyStatsRef),
    ])

    if (!customerSnap.exists()) {
      throw new Error('Customer must exist before a bill can be created for them.')
    }

    const nextBillNo = (counterSnap.exists() ? counterSnap.data().currentValue : 0) + 1

    const billData: Bill = {
      id: billRef.id,
      billNo: nextBillNo,
      date: serverTimestamp() as unknown as Bill['date'],
      customerId: input.customerId,
      customerName: input.customerName,
      customerMobile: input.customerMobile,
      items: calculation.items,
      totalProductAmountPaise: calculation.totalProductAmountPaise,
      totalItemDiscountPaise: calculation.totalItemDiscountPaise,
      subtotalAfterItemDiscountPaise: calculation.subtotalAfterItemDiscountPaise,
      overallDiscountPct: calculation.overallDiscountPct,
      overallDiscountPaise: calculation.overallDiscountPaise,
      roundOffPaise: calculation.roundOffPaise ?? 0,
      totalDiscountPaise: calculation.totalDiscountPaise,
      netPayableAmountPaise: calculation.netPayableAmountPaise,
      paymentStatus: input.paymentStatus,
      amountPaidPaise: input.amountPaidPaise,
      dueAmountPaise,
      paymentModes: input.paymentModes,
      status: 'active',
      cancelledAt: null,
      cancelledByUid: null,
      createdByUid: input.createdByUid,
      createdByRole: input.createdByRole,
      createdAt: serverTimestamp() as unknown as Bill['createdAt'],
    }

    tx.set(billRef, billData)

    tx.set(
      counterRef,
      { currentValue: nextBillNo, updatedAt: serverTimestamp() },
      { merge: false },
    )

    tx.update(customerRef, {
      outstandingBalancePaise: increment(dueAmountPaise),
      totalSpentPaise: increment(calculation.netPayableAmountPaise),
      billCount: increment(1),
      lastBillNo: nextBillNo,
      lastBillAt: serverTimestamp(),
    })

    tx.set(
      globalStatsRef,
      {
        totalOutstandingPaise: increment(dueAmountPaise),
        totalRevenuePaise: increment(calculation.netPayableAmountPaise),
        lastUpdatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    if (statsSnap.exists()) {
      tx.update(statsRef, {
        totalSalesPaise: increment(calculation.netPayableAmountPaise),
        cashCollectedPaise: increment(collected.cashCollectedPaise),
        upiCollectedPaise: increment(collected.upiCollectedPaise),
        bankTransferCollectedPaise: increment(collected.bankTransferCollectedPaise),
        otherCollectedPaise: increment(collected.otherCollectedPaise),
        billCount: increment(1),
        creditAmountPaise: increment(dueAmountPaise),
        lastUpdatedAt: serverTimestamp(),
      })
    } else {
      tx.set(statsRef, {
        date: dateKey,
        totalSalesPaise: calculation.netPayableAmountPaise,
        cashCollectedPaise: collected.cashCollectedPaise,
        upiCollectedPaise: collected.upiCollectedPaise,
        bankTransferCollectedPaise: collected.bankTransferCollectedPaise,
        otherCollectedPaise: collected.otherCollectedPaise,
        billCount: 1,
        creditAmountPaise: dueAmountPaise,
        lastUpdatedAt: serverTimestamp(),
      })
    }

    if (monthlyStatsSnap.exists()) {
      tx.update(monthlyStatsRef, {
        totalSalesPaise: increment(calculation.netPayableAmountPaise),
        cashCollectedPaise: increment(collected.cashCollectedPaise),
        upiCollectedPaise: increment(collected.upiCollectedPaise),
        bankTransferCollectedPaise: increment(collected.bankTransferCollectedPaise),
        otherCollectedPaise: increment(collected.otherCollectedPaise),
        billCount: increment(1),
        creditAmountPaise: increment(dueAmountPaise),
        lastUpdatedAt: serverTimestamp(),
      })
    } else {
      tx.set(monthlyStatsRef, {
        month: monthKey,
        totalSalesPaise: calculation.netPayableAmountPaise,
        cashCollectedPaise: collected.cashCollectedPaise,
        upiCollectedPaise: collected.upiCollectedPaise,
        bankTransferCollectedPaise: collected.bankTransferCollectedPaise,
        otherCollectedPaise: collected.otherCollectedPaise,
        billCount: 1,
        creditAmountPaise: dueAmountPaise,
        lastUpdatedAt: serverTimestamp(),
      })
    }

    return billData
  })

  return bill
}
