import type { Timestamp } from 'firebase/firestore'
import type { UserRole } from './user'

export type DayCloseStatus = 'open' | 'closed'

export interface CashDenominations {
  c500?: number
  c200?: number
  c100?: number
  c50?: number
  c20?: number
  c10?: number
  coins?: number
}

export interface DayExpenseItem {
  id: string
  title: string
  amountPaise: number
  mode: 'cash' | 'upi'
}

export interface DayClosure {
  id?: string
  date: string // "YYYY-MM-DD"
  status: DayCloseStatus

  // Sales metrics (Bikri aur hisaab)
  billCount: number
  cancelledBillCount: number
  totalItemsSold: number
  grossSalesPaise: number
  totalDiscountPaise: number
  roundOffPaise: number
  netSalesPaise: number

  // Collections metrics (Jama / Payment modes)
  cashCollectedPaise: number
  upiCollectedPaise: number
  bankTransferCollectedPaise: number
  otherCollectedPaise: number
  totalCollectedPaise: number
  creditAmountPaise: number // Pending dues / Naya Udhar
  pastDuesCollectedPaise: number // Purani vasooli

  // Expenses (Gulle se kiye gaye dukan ke kharche: Chai, tempo, packing, etc.)
  expenses?: DayExpenseItem[]
  totalCashExpensesPaise?: number
  totalExpensesPaise?: number

  // Cash Drawer (Gulla) Reconciliation
  openingCashPaise: number // Shuruat ka Cash / Float
  expectedCashPaise: number // Hisaab ke mutabiq gulle me hona chahiye (Opening + Cash Sales - Cash Expenses)
  actualCashPaise: number // Gin-ne par gulle me mila
  cashDiscrepancyPaise: number // Farak: actual - expected (+ extra, - kam)

  // Cash kept for tomorrow & cash withdrawn (Bank / Malik ko dene wala)
  closingCashKeptPaise?: number // Kal ke liye gulle me chhoda gaya cash (Next Day Opening)
  cashWithdrawnPaise?: number // Aaj nikala gaya cash (Bank ya Ghar ke liye)

  // Denominations count (Note ginti)
  denominations?: CashDenominations

  // Audit info
  notes?: string
  closedAt?: Timestamp
  closedByUid?: string
  closedByName?: string
  closedByRole?: UserRole
  updatedAt?: Timestamp
}
