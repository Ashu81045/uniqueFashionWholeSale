import { calculateBill, type BillLineItemInput } from '../../lib/billing/calculateBill'
import { createBillTransaction } from '../../lib/numbering/createBillTransaction'
import { upsertProductSuggestions } from '../../lib/products/upsertProductSuggestions'
import type { Bill, BillPaymentModeSplit, PaymentStatus } from '../../types/bill'
import type { UserRole } from '../../types/user'

export interface SaveBillInput {
  items: BillLineItemInput[]
  overallDiscountPct: number
  roundOffPaise?: number
  customerId: string
  customerName: string
  customerMobile: string
  paymentStatus: PaymentStatus
  paymentModes: BillPaymentModeSplit[]
  createdByUid: string
  createdByRole: UserRole
}

export async function saveBill(input: SaveBillInput): Promise<Bill> {
  const calculation = calculateBill(input.items, input.overallDiscountPct, input.roundOffPaise ?? 0)
  const amountPaidPaise = input.paymentModes.reduce((total, s) => total + s.amountPaise, 0)

  const bill = await createBillTransaction({
    calculation,
    customerId: input.customerId,
    customerName: input.customerName,
    customerMobile: input.customerMobile,
    paymentStatus: input.paymentStatus,
    amountPaidPaise,
    paymentModes: input.paymentModes,
    createdByUid: input.createdByUid,
    createdByRole: input.createdByRole,
  })

  // Best-effort, non-blocking — never delays navigation or fails the save.
  upsertProductSuggestions(
    calculation.items.map((item) => ({
      name: item.name,
      qty: item.qty,
      discountedAmountPaise: item.discountedAmountPaise,
    })),
  ).catch(() => {})

  return bill
}
