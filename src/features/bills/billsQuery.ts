import {
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { billDocRef, billsCol } from '../../firebase/firestore'
import type { Bill } from '../../types/bill'
import type { UserRole } from '../../types/user'

export async function fetchBillById(billId: string): Promise<Bill | null> {
  const snap = await getDoc(billDocRef(billId))
  return snap.exists() ? snap.data() : null
}

export const BILLS_PAGE_SIZE = 20

export interface BillsPage {
  bills: Bill[]
  lastDoc: QueryDocumentSnapshot<Bill> | null
  hasMore: boolean
}

/** Accountants only ever see their own bills; admins see every active bill. */
export async function fetchBillsPage(
  role: UserRole,
  uid: string,
  cursor: QueryDocumentSnapshot<Bill> | null,
): Promise<BillsPage> {
  const constraints =
    role === 'admin'
      ? [where('status', '==', 'active'), orderBy('createdAt', 'desc')]
      : [
          where('status', '==', 'active'),
          where('createdByUid', '==', uid),
          orderBy('createdAt', 'desc'),
        ]

  const q = cursor
    ? query(billsCol(), ...constraints, startAfter(cursor), limit(BILLS_PAGE_SIZE))
    : query(billsCol(), ...constraints, limit(BILLS_PAGE_SIZE))

  const snap = await getDocs(q)
  const bills = snap.docs.map((d) => d.data())
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null

  return { bills, lastDoc, hasMore: snap.docs.length === BILLS_PAGE_SIZE }
}

/** Fetches a batch of recent active bills for auditing, Day Close, and multi-date analytics. */
export async function fetchRecentBills(
  role: UserRole,
  uid: string,
  maxCount = 200,
): Promise<Bill[]> {
  const constraints =
    role === 'admin'
      ? [where('status', '==', 'active'), orderBy('createdAt', 'desc'), limit(maxCount)]
      : [
          where('status', '==', 'active'),
          where('createdByUid', '==', uid),
          orderBy('createdAt', 'desc'),
          limit(maxCount),
        ]

  const q = query(billsCol(), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data())
}

