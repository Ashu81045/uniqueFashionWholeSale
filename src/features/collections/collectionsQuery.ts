import { getDocs } from 'firebase/firestore'
import { paymentsCollectionGroup } from '../../firebase/firestore'
import type { CustomerPayment } from '../../types/payment'

function toMillis(payment: CustomerPayment): number {
  return payment.createdAt?.toMillis?.() ?? 0
}

/**
 * Every payment recorded against any customer, newest first.
 *
 * Collection-group queries need an explicit Firestore index for any
 * orderBy/where clause — rather than depend on one being deployed, this
 * fetches the whole (unordered, unfiltered) "payments" group in a single
 * read and sorts/filters client-side. Fine at this business's scale; if
 * payment volume grows large enough for a full-collection read to matter,
 * switch back to a server-side orderBy backed by a deployed collection-group
 * index (see firestore.indexes.json) plus real cursor pagination.
 */
export async function fetchAllPayments(): Promise<CustomerPayment[]> {
  const snap = await getDocs(paymentsCollectionGroup())
  return snap.docs.map((d) => d.data()).sort((a, b) => toMillis(b) - toMillis(a))
}

/** Every payment recorded since `sinceDate`, across all customers, newest first. */
export async function fetchPaymentsSince(sinceDate: Date): Promise<CustomerPayment[]> {
  const sinceMs = sinceDate.getTime()
  const all = await fetchAllPayments()
  return all.filter((p) => toMillis(p) >= sinceMs)
}
