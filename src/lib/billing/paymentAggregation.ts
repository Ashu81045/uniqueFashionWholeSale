import type { BillPaymentModeSplit } from '../../types/bill'

export interface CollectedByMode {
  cashCollectedPaise: number
  upiCollectedPaise: number
  bankTransferCollectedPaise: number
  otherCollectedPaise: number
}

/** Buckets a bill's payment splits into the same categories dailyStats tracks. */
export function aggregateCollectedByMode(paymentModes: BillPaymentModeSplit[]): CollectedByMode {
  let cashCollectedPaise = 0
  let upiCollectedPaise = 0
  let bankTransferCollectedPaise = 0
  let otherCollectedPaise = 0

  for (const split of paymentModes) {
    if (split.mode === 'cash') cashCollectedPaise += split.amountPaise
    else if (split.mode === 'upi' || split.mode === 'gpay' || split.mode === 'phonepe')
      upiCollectedPaise += split.amountPaise
    else if (split.mode === 'bank_transfer') bankTransferCollectedPaise += split.amountPaise
    else otherCollectedPaise += split.amountPaise
  }

  return { cashCollectedPaise, upiCollectedPaise, bankTransferCollectedPaise, otherCollectedPaise }
}
