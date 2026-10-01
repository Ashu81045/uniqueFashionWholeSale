import { getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { customerDocRef } from '../../firebase/firestore'
import type { Customer } from '../../types/customer'

export async function getCustomerByMobile(mobile: string): Promise<Customer | null> {
  const snap = await getDoc(customerDocRef(mobile))
  return snap.exists() ? snap.data() : null
}

export async function createCustomer(
  mobile: string,
  name: string,
  createdByUid: string,
): Promise<Customer> {
  const ref = customerDocRef(mobile)
  const data = {
    mobile,
    name,
    outstandingBalancePaise: 0,
    totalSpentPaise: 0,
    billCount: 0,
    lastBillNo: null,
    lastBillAt: null,
    createdByUid,
    createdAt: serverTimestamp(),
  }
  // Cast: serverTimestamp() sentinel isn't assignable to the read-side Timestamp
  // type, but that's exactly what Firestore expects on write.
  await setDoc(ref, data as unknown as Customer)
  const snap = await getDoc(ref)
  return snap.data() as Customer
}
