import { fetchBillsPage } from '../bills/billsQuery'
import { fetchAllPayments } from '../collections/collectionsQuery'
import type { PaymentMode } from '../../types/payment'
import type { UserRole } from '../../types/user'

export interface LedgerFeedEntry {
  key: string
  type: 'bill' | 'payment'
  customerMobile: string
  customerName?: string
  amountPaise: number
  billNo?: number
  mode?: PaymentMode
  date: Date
}

/**
 * Merges the most recent bills (debits) and payments (credits) across every
 * customer into one activity feed — reuses the existing role-scoped bills
 * query and the (unrestricted, per Firestore rules) payments collection-group
 * query rather than duplicating either's Firestore logic.
 */
export async function fetchRecentLedgerFeed(
  role: UserRole,
  uid: string,
  limitCount = 15,
): Promise<LedgerFeedEntry[]> {
  const [billsPage, payments] = await Promise.all([fetchBillsPage(role, uid, null), fetchAllPayments()])

  const billEntries: LedgerFeedEntry[] = billsPage.bills.map((bill) => ({
    key: `bill-${bill.id}`,
    type: 'bill',
    customerMobile: bill.customerId,
    customerName: bill.customerName,
    amountPaise: bill.netPayableAmountPaise,
    billNo: bill.billNo,
    date: bill.createdAt?.toDate?.() ?? new Date(),
  }))

  const paymentEntries: LedgerFeedEntry[] = payments.map((payment) => ({
    key: `payment-${payment.id}`,
    type: 'payment',
    customerMobile: payment.customerMobile ?? '',
    amountPaise: payment.amountPaise,
    mode: payment.mode,
    date: payment.createdAt?.toDate?.() ?? new Date(),
  }))

  return [...billEntries, ...paymentEntries]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limitCount)
}
