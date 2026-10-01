import type { Timestamp } from 'firebase/firestore'
import type { UserRole } from './user'

export type PaymentMode = 'cash' | 'upi' | 'gpay' | 'phonepe' | 'bank_transfer' | 'other'

/** customers/{customerId}/payments/{paymentId} — money collected against past dues. */
export interface CustomerPayment {
  id: string
  amountPaise: number
  mode: PaymentMode
  note?: string
  createdAt: Timestamp
  createdByUid: string
  createdByRole: UserRole
  /** Only populated when read via a collectionGroup('payments') query (parent doc id). */
  customerMobile?: string
}
