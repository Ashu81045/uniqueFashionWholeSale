import type { Timestamp } from 'firebase/firestore'
import type { PaymentMode } from './payment'
import type { UserRole } from './user'

export type PaymentStatus = 'paid' | 'partial' | 'credit'
export type BillStatus = 'active' | 'cancelled'

export interface BillLineItem {
  name: string
  qty: number
  ratePaise: number
  itemDiscountPct: number
  amountPaise: number
  discountedAmountPaise: number
}

export interface BillPaymentModeSplit {
  mode: PaymentMode
  amountPaise: number
}

/** bills/{autoId} */
export interface Bill {
  id: string
  billNo: number
  date: Timestamp

  customerId: string // == customer mobile
  customerName: string // denormalized snapshot at time of billing
  customerMobile: string // denormalized snapshot at time of billing

  items: BillLineItem[]

  totalProductAmountPaise: number
  totalItemDiscountPaise: number
  subtotalAfterItemDiscountPaise: number
  overallDiscountPct: number
  overallDiscountPaise: number
  totalDiscountPaise: number
  roundOffPaise?: number
  netPayableAmountPaise: number

  paymentStatus: PaymentStatus
  amountPaidPaise: number
  dueAmountPaise: number
  paymentModes: BillPaymentModeSplit[]

  status: BillStatus
  cancelledAt: Timestamp | null
  cancelledByUid: string | null

  // Internal-only — never rendered on the customer-facing invoice.
  createdByUid: string
  createdByRole: UserRole
  createdAt: Timestamp
}
