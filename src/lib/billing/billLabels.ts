import type { BillPaymentModeSplit } from '../../types/bill'

export interface BillLabels {
  appName: string
  billNumber: string
  customer: string
  productName: string
  rate: string
  qty: string
  itemDiscount: string
  amount: string
  totalProductAmount: string
  overallDiscount: string
  totalItemDiscount: string
  roundOff: string
  totalDiscount: string
  netPayable: string
  amountPaid: string
  due: string
  paymentMode: string
  paymentModeLabel: (mode: BillPaymentModeSplit['mode']) => string
}

/**
 * Resolves every translated string the A4 bill needs, once, up front.
 * Kept separate from the drawing code (lib/pdf/drawA4Bill.ts) so that code
 * stays a plain function with no React/hook dependency — callers (which are
 * React components, and already have `t` from useT()) build this object and
 * pass it in.
 */
export function buildBillLabels(t: (key: string) => string): BillLabels {
  return {
    appName: t('app.name'),
    billNumber: t('bill.number'),
    customer: t('bill.customer'),
    productName: t('bill.productName'),
    rate: t('bill.rate'),
    qty: t('bill.qty'),
    itemDiscount: t('bill.itemDiscount'),
    amount: t('bill.amount'),
    totalProductAmount: t('bill.totalProductAmount'),
    overallDiscount: t('bill.overallDiscount'),
    totalItemDiscount: t('bill.totalItemDiscount'),
    roundOff: t('bill.roundOff') || 'Round Off',
    totalDiscount: t('bill.totalDiscount'),
    netPayable: t('bill.netPayable'),
    amountPaid: t('bill.amountPaid'),
    due: t('bill.due'),
    paymentMode: t('bill.paymentMode'),
    paymentModeLabel: (mode) => t(`bill.paymentMode.${mode}`),
  }
}
