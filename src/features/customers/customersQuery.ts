import { getDocs, limit, orderBy, query, startAfter, type QueryDocumentSnapshot } from 'firebase/firestore'
import { customersCol } from '../../firebase/firestore'
import type { Customer } from '../../types/customer'

/** Top customers by cumulative spend. */
export async function queryTopCustomers(limitCount = 5): Promise<Customer[]> {
  const q = query(customersCol(), orderBy('totalSpentPaise', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data())
}

export const CUSTOMERS_PAGE_SIZE = 20

export interface CustomersPage {
  customers: Customer[]
  lastDoc: QueryDocumentSnapshot<Customer> | null
  hasMore: boolean
}

/** "Customer-wise due" — ordered by outstanding balance, highest first. */
export async function fetchCustomersPage(
  cursor: QueryDocumentSnapshot<Customer> | null,
): Promise<CustomersPage> {
  const q = cursor
    ? query(
        customersCol(),
        orderBy('outstandingBalancePaise', 'desc'),
        startAfter(cursor),
        limit(CUSTOMERS_PAGE_SIZE),
      )
    : query(customersCol(), orderBy('outstandingBalancePaise', 'desc'), limit(CUSTOMERS_PAGE_SIZE))

  const snap = await getDocs(q)
  const customers = snap.docs.map((d) => d.data())
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null
  return { customers, lastDoc, hasMore: snap.docs.length === CUSTOMERS_PAGE_SIZE }
}
