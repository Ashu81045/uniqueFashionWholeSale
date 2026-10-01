import { formatPaiseAsRupees } from '../../../lib/billing/formatCurrency'
import { formatDisplayDate } from '../../../lib/utils/date'
import type { DayClosure } from '../../../types/dayClose'

export function DayClosePrintSlip({ closure }: { closure: DayClosure }) {
  const discrepancy = closure.actualCashPaise - closure.expectedCashPaise
  const cashKept = closure.closingCashKeptPaise || 0
  const cashWithdrawn = Math.max(0, closure.actualCashPaise - cashKept)
  const cashExpenses = closure.totalCashExpensesPaise || 0

  return (
    <div className="bg-white p-6 text-slate-900 font-mono text-xs max-w-md mx-auto border border-slate-300 rounded-lg shadow-sm print:border-none print:shadow-none print:max-w-full print:p-0">
      <div className="text-center border-b-2 border-slate-900 pb-3 mb-3">
        <h1 className="text-base font-bold uppercase tracking-wider">Unique Fashions Wholesale</h1>
        <p className="text-[11px] text-slate-800 font-sans font-semibold">
          Rozana Gulla Hisaab & Day Close Parchi (Daily Closure Slip)
        </p>
        <p className="text-xs font-bold mt-1 text-slate-950">
          TAREEKH / DATE: {formatDisplayDate(new Date(`${closure.date}T00:00:00`))} ({closure.date})
        </p>
        <div className="mt-1 flex items-center justify-center gap-2 text-[10px] text-slate-700 font-medium">
          <span>Status: <strong>{closure.status === 'closed' ? 'BAND (CLOSED)' : 'CHALU (OPEN)'}</strong></span>
          {closure.closedByName && <span>• Munshi: <strong>{closure.closedByName}</strong></span>}
        </div>
      </div>

      {/* 1. Sales Summary */}
      <div className="mb-3 border-b border-dashed border-slate-400 pb-2">
        <p className="font-bold border-b border-slate-300 pb-0.5 mb-1.5 uppercase text-[11px] text-slate-950">
          1. Bikri ka Hisaab (Sales Summary)
        </p>
        <div className="flex justify-between py-0.5">
          <span>Kul Parchi (Active Bills):</span>
          <span className="font-bold">{closure.billCount}</span>
        </div>
        {closure.cancelledBillCount > 0 && (
          <div className="flex justify-between py-0.5 text-red-700 font-semibold">
            <span>Radd Parchi (Cancelled Bills):</span>
            <span>{closure.cancelledBillCount}</span>
          </div>
        )}
        <div className="flex justify-between py-0.5">
          <span>Kul Maal (Units Sold):</span>
          <span>{closure.totalItemsSold} Piece</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span>Kul Bikri (Gross Product):</span>
          <span>{formatPaiseAsRupees(closure.grossSalesPaise)}</span>
        </div>
        {closure.totalDiscountPaise > 0 && (
          <div className="flex justify-between py-0.5 text-slate-700">
            <span>Kul Discount / Chhoot:</span>
            <span>- {formatPaiseAsRupees(closure.totalDiscountPaise)}</span>
          </div>
        )}
        {closure.roundOffPaise !== 0 && (
          <div className="flex justify-between py-0.5 text-slate-700">
            <span>Round Off:</span>
            <span>{formatPaiseAsRupees(closure.roundOffPaise)}</span>
          </div>
        )}
        <div className="flex justify-between py-1 border-t border-slate-900 font-bold text-sm mt-1">
          <span>NET BIKRI (NET SALES):</span>
          <span>{formatPaiseAsRupees(closure.netSalesPaise)}</span>
        </div>
      </div>

      {/* 2. Collections (Highlighted UPI and Cash) */}
      <div className="mb-3 border-b border-dashed border-slate-400 pb-2">
        <p className="font-bold border-b border-slate-300 pb-0.5 mb-1.5 uppercase text-[11px] text-slate-950">
          2. Jama Rakam (Collections by Mode)
        </p>
        <div className="flex justify-between py-0.5">
          <span>Cash me Bikri (Cash Bills):</span>
          <span className="font-bold">{formatPaiseAsRupees(closure.cashCollectedPaise)}</span>
        </div>
        <div className="flex justify-between py-1 bg-blue-50 px-1.5 rounded font-bold text-blue-950 my-0.5 border border-blue-200">
          <span>UPI / QR Jama (GPay, PhonePe):</span>
          <span>{formatPaiseAsRupees(closure.upiCollectedPaise)}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span>Bank Transfer / Khata:</span>
          <span>{formatPaiseAsRupees(closure.bankTransferCollectedPaise)}</span>
        </div>
        {closure.otherCollectedPaise > 0 && (
          <div className="flex justify-between py-0.5">
            <span>Anya Mode:</span>
            <span>{formatPaiseAsRupees(closure.otherCollectedPaise)}</span>
          </div>
        )}
        {closure.pastDuesCollectedPaise > 0 && (
          <div className="flex justify-between py-0.5 text-blue-900 font-bold">
            <span>Purani Udhar Vasooli (Dues):</span>
            <span>+ {formatPaiseAsRupees(closure.pastDuesCollectedPaise)}</span>
          </div>
        )}
        <div className="flex justify-between py-1 border-t border-slate-900 font-bold text-xs mt-1">
          <span>KUL JAMA (TOTAL COLLECTED):</span>
          <span>{formatPaiseAsRupees(closure.totalCollectedPaise)}</span>
        </div>
        {closure.creditAmountPaise > 0 && (
          <div className="flex justify-between py-0.5 text-red-700 font-bold border-t border-dotted border-slate-300 mt-1">
            <span>Naya Udhar (Pending Dues):</span>
            <span>{formatPaiseAsRupees(closure.creditAmountPaise)}</span>
          </div>
        )}
      </div>

      {/* 2B. Expenses (Dukan ke Kharche) */}
      {(closure.totalExpensesPaise || 0) > 0 && (
        <div className="mb-3 border-b border-dashed border-slate-400 pb-2">
          <p className="font-bold border-b border-slate-300 pb-0.5 mb-1.5 uppercase text-[11px] text-slate-950">
            Dukan ke Kharche (Expenses)
          </p>
          {closure.expenses?.map((e) => (
            <div key={e.id} className="flex justify-between py-0.5 text-slate-800">
              <span>{e.title} ({e.mode.toUpperCase()}):</span>
              <span className="font-semibold">- {formatPaiseAsRupees(e.amountPaise)}</span>
            </div>
          ))}
          <div className="flex justify-between py-1 border-t border-slate-300 font-bold text-xs mt-1 text-red-800">
            <span>Gulle se Kul Cash Kharche:</span>
            <span>- {formatPaiseAsRupees(cashExpenses)}</span>
          </div>
        </div>
      )}

      {/* 3. Gulla Hisaab & Farak */}
      <div className="mb-3 border-b border-dashed border-slate-400 pb-2">
        <p className="font-bold border-b border-slate-300 pb-0.5 mb-1.5 uppercase text-[11px] text-slate-950">
          3. Gulla Hisaab & Farak (Drawer Reconciliation)
        </p>
        <div className="flex justify-between py-0.5">
          <span>Subah ka Cash (Opening Float):</span>
          <span>{formatPaiseAsRupees(closure.openingCashPaise)}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span>+ Aaj aaya Cash (Cash Inflow):</span>
          <span>+ {formatPaiseAsRupees(closure.cashCollectedPaise)}</span>
        </div>
        {cashExpenses > 0 && (
          <div className="flex justify-between py-0.5 text-red-700">
            <span>- Gulle se Kharche (Cash Expenses):</span>
            <span>- {formatPaiseAsRupees(cashExpenses)}</span>
          </div>
        )}
        <div className="flex justify-between py-1 border-t border-slate-300 font-bold text-slate-950">
          <span>= Gulle me hona chahiye (Expected):</span>
          <span>{formatPaiseAsRupees(closure.expectedCashPaise)}</span>
        </div>
        <div className="flex justify-between py-1 border-t border-slate-900 font-bold text-xs bg-slate-100 px-1 rounded">
          <span>Asli gina hua Cash (Counted Cash):</span>
          <span>{formatPaiseAsRupees(closure.actualCashPaise)}</span>
        </div>

        {/* Farak display */}
        <div
          className={`flex justify-between py-1.5 font-bold text-xs mt-1.5 px-2 rounded ${
            discrepancy === 0
              ? 'bg-emerald-100 text-emerald-950 border border-emerald-400'
              : discrepancy > 0
              ? 'bg-amber-100 text-amber-950 border border-amber-400'
              : 'bg-red-100 text-red-950 border border-red-400'
          }`}
        >
          <span>
            {discrepancy === 0
              ? '✓ Gulla Barabar (No Difference):'
              : discrepancy > 0
              ? '▲ Extra Cash mila (Surplus):'
              : '▼ Cash Kam hai (Shortage):'}
          </span>
          <span className="text-sm">
            {discrepancy === 0 ? '₹0' : (discrepancy > 0 ? '+' : '-') + formatPaiseAsRupees(Math.abs(discrepancy))}
          </span>
        </div>
      </div>

      {/* 4. Cash Left for Tomorrow & Net Takeout */}
      <div className="mb-3 border-b border-slate-300 pb-2">
        <p className="font-bold border-b border-slate-300 pb-0.5 mb-1.5 uppercase text-[11px] text-slate-950">
          4. Kal ke liye Cash & Nikasi (Closing Cash Float)
        </p>
        <div className="flex justify-between py-0.5 font-medium">
          <span>Kal subah ke liye gulle me chhoda:</span>
          <span className="font-bold">{formatPaiseAsRupees(cashKept)}</span>
        </div>
        <div className="flex justify-between py-0.5 font-bold text-blue-950">
          <span>Ghar / Bank le jane wala Cash:</span>
          <span>{formatPaiseAsRupees(cashWithdrawn)}</span>
        </div>
      </div>

      {/* Notes & Signatures */}
      {closure.notes && (
        <div className="mb-3 border-b border-slate-300 pb-2">
          <p className="font-bold uppercase text-[10px] text-slate-600">Munshi / Staff Note:</p>
          <p className="mt-0.5 italic text-slate-900 font-sans">{closure.notes}</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-900 flex justify-between text-[10px]">
        <div>
          <p>Munshi Signature: __________________</p>
          <p className="mt-0.5 text-slate-700 font-sans font-medium">{closure.closedByName || 'Staff Member'}</p>
        </div>
        <div className="text-right">
          <p>Malik / Manager Signature: ___________</p>
          <p className="mt-0.5 text-slate-700 font-sans font-medium">Janch kiya hua (Audited)</p>
        </div>
      </div>
    </div>
  )
}
