import type { Customer } from './customer'
import type { BillLineItemInput } from '../lib/billing/calculateBill'
import type { BillPaymentModeSplit, PaymentStatus } from './bill'

export interface DraftBill {
  id: string
  draftNo: number
  createdAt: number // epoch ms
  updatedAt: number // epoch ms
  customer: Customer | null
  items: BillLineItemInput[]
  overallDiscountPct: number
  roundOffPaise: number
  paymentStatus: PaymentStatus
  paymentModes: BillPaymentModeSplit[]
  // Pre-computed snapshot for quick list display
  customerName: string
  customerMobile: string
  itemCount: number
  netPayableAmountPaise: number
  isAutoSave?: boolean
}
