import type { BillPreviewData } from '../billing/components/BillPreview'
import type { Bill } from '../../types/bill'

export function billToPreviewData(bill: Bill): BillPreviewData {
  return {
    billNo: bill.billNo,
    date: bill.date?.toDate?.() ?? new Date(),
    customerName: bill.customerName,
    customerMobile: bill.customerMobile,
    items: bill.items.map((item) => ({
      ...item,
      itemDiscountPaise: item.amountPaise - item.discountedAmountPaise,
    })),
    totalProductAmountPaise: bill.totalProductAmountPaise,
    totalItemDiscountPaise: bill.totalItemDiscountPaise,
    overallDiscountPct: bill.overallDiscountPct,
    overallDiscountPaise: bill.overallDiscountPaise,
    roundOffPaise: bill.roundOffPaise ?? 0,
    totalDiscountPaise: bill.totalDiscountPaise,
    netPayableAmountPaise: bill.netPayableAmountPaise,
    paymentStatus: bill.paymentStatus,
    amountPaidPaise: bill.amountPaidPaise,
    dueAmountPaise: bill.dueAmountPaise,
    paymentModes: bill.paymentModes,
  }
}
