import { describe, expect, it } from 'vitest'
import { calculateBill } from './calculateBill'

describe('calculateBill', () => {
  it('matches the worked example: Shirt x2 @500, Jeans x3 @800, T-shirt x1 @400, overall 10%, item discounts 5%/3%/0%', () => {
    const result = calculateBill(
      [
        { name: 'Shirt', qty: 2, ratePaise: 50000, itemDiscountPct: 5 },
        { name: 'Jeans', qty: 3, ratePaise: 80000, itemDiscountPct: 3 },
        { name: 'T-shirt', qty: 1, ratePaise: 40000, itemDiscountPct: 0 },
      ],
      10,
    )

    expect(result.totalProductAmountPaise).toBe(380000) // ₹3800
    expect(result.totalItemDiscountPaise).toBe(12200) // ₹122
    expect(result.subtotalAfterItemDiscountPaise).toBe(367800) // ₹3678
    expect(result.overallDiscountPaise).toBe(36780) // ₹367.80 -> rounds to 36780 paise
    expect(result.netPayableAmountPaise).toBe(331020) // ₹3678 - ₹367.80 = ₹3310.20
    expect(result.totalDiscountPaise).toBe(48980) // ₹122 + ₹367.80

    // Sanity check: totalProductAmount - totalDiscount must equal netPayable,
    // computed independently, guarding against formula drift.
    expect(result.totalProductAmountPaise - result.totalDiscountPaise).toBe(
      result.netPayableAmountPaise,
    )
  })

  it('applies zero discount correctly (net payable == total product amount)', () => {
    const result = calculateBill([{ name: 'Item', qty: 1, ratePaise: 10000, itemDiscountPct: 0 }], 0)
    expect(result.netPayableAmountPaise).toBe(10000)
    expect(result.totalDiscountPaise).toBe(0)
  })

  it('handles a 100% overall discount (net payable == 0)', () => {
    const result = calculateBill([{ name: 'Item', qty: 2, ratePaise: 5000, itemDiscountPct: 0 }], 100)
    expect(result.netPayableAmountPaise).toBe(0)
  })

  it('handles a single item with only an item-level discount and no overall discount', () => {
    const result = calculateBill([{ name: 'Item', qty: 4, ratePaise: 25000, itemDiscountPct: 10 }], 0)
    expect(result.totalProductAmountPaise).toBe(100000)
    expect(result.totalItemDiscountPaise).toBe(10000)
    expect(result.netPayableAmountPaise).toBe(90000)
  })

  it('handles an empty items list', () => {
    const result = calculateBill([], 10)
    expect(result.totalProductAmountPaise).toBe(0)
    expect(result.netPayableAmountPaise).toBe(0)
  })

  it('rounds fractional paise consistently across multiple items', () => {
    const result = calculateBill(
      [
        { name: 'A', qty: 3, ratePaise: 333, itemDiscountPct: 7 },
        { name: 'B', qty: 1, ratePaise: 999, itemDiscountPct: 13 },
      ],
      9,
    )
    // Each item's discountedAmount + itemDiscount must reconstruct its amount exactly.
    for (const item of result.items) {
      expect(item.discountedAmountPaise + item.itemDiscountPaise).toBe(item.amountPaise)
    }
    expect(result.subtotalAfterItemDiscountPaise - result.overallDiscountPaise).toBe(
      result.netPayableAmountPaise,
    )
  })
})
