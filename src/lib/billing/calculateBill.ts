export interface BillLineItemInput {
  name: string
  qty: number
  ratePaise: number
  itemDiscountPct: number // 0-100
}

export interface BillLineItemComputed extends BillLineItemInput {
  amountPaise: number
  itemDiscountPaise: number
  discountedAmountPaise: number
}

export interface BillCalculationResult {
  items: BillLineItemComputed[]
  totalProductAmountPaise: number
  totalItemDiscountPaise: number
  subtotalAfterItemDiscountPaise: number
  overallDiscountPct: number
  overallDiscountPaise: number
  roundOffPaise: number
  totalDiscountPaise: number
  netPayableAmountPaise: number
}

/**
 * Item discounts apply first (per line), then the overall bill discount applies
 * to the post-item-discount subtotal, and finally any round-off adjustment.
 */
export function calculateBill(
  items: BillLineItemInput[],
  overallDiscountPct: number,
  roundOffPaise = 0,
): BillCalculationResult {
  const computedItems: BillLineItemComputed[] = items.map((item) => {
    const amountPaise = Math.round(item.qty * item.ratePaise)
    const itemDiscountPaise = Math.round((amountPaise * item.itemDiscountPct) / 100)
    const discountedAmountPaise = amountPaise - itemDiscountPaise
    return { ...item, amountPaise, itemDiscountPaise, discountedAmountPaise }
  })

  const totalProductAmountPaise = sum(computedItems.map((i) => i.amountPaise))
  const totalItemDiscountPaise = sum(computedItems.map((i) => i.itemDiscountPaise))
  const subtotalAfterItemDiscountPaise = sum(computedItems.map((i) => i.discountedAmountPaise))

  const overallDiscountPaise = Math.round(
    (subtotalAfterItemDiscountPaise * overallDiscountPct) / 100,
  )
  const preRoundNetPaise = subtotalAfterItemDiscountPaise - overallDiscountPaise
  const netPayableAmountPaise = Math.max(0, preRoundNetPaise + roundOffPaise)
  // If roundOff is negative (a round-off deduction/discount, e.g. -11000 paise = -₹110),
  // it contributes to the total discount given to the customer.
  const totalDiscountPaise =
    totalItemDiscountPaise + overallDiscountPaise + (roundOffPaise < 0 ? -roundOffPaise : 0)

  return {
    items: computedItems,
    totalProductAmountPaise,
    totalItemDiscountPaise,
    subtotalAfterItemDiscountPaise,
    overallDiscountPct,
    overallDiscountPaise,
    roundOffPaise,
    totalDiscountPaise,
    netPayableAmountPaise,
  }
}

function sum(values: number[]): number {
  return values.reduce((total, v) => total + v, 0)
}
