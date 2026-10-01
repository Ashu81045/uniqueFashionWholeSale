import { useCallback, useEffect, useState } from 'react'
import { fetchPaymentsSince } from '../features/collections/collectionsQuery'
import { fetchUsers } from '../features/users/userService'
import { useAuthStore } from '../stores/authStore'
import type { CustomerPayment } from '../types/payment'
import type { UserRole } from '../types/user'

export interface CollectorRow {
  uid: string
  name: string
  role: UserRole
  totalPaise: number
  count: number
}

function groupByCollector(
  payments: CustomerPayment[],
  namesByUid: Map<string, { name: string; role: UserRole }>,
): CollectorRow[] {
  const totals = new Map<string, { totalPaise: number; count: number }>()
  for (const p of payments) {
    const existing = totals.get(p.createdByUid)
    if (existing) {
      existing.totalPaise += p.amountPaise
      existing.count += 1
    } else {
      totals.set(p.createdByUid, { totalPaise: p.amountPaise, count: 1 })
    }
  }
  return Array.from(totals.entries())
    .map(([uid, { totalPaise, count }]) => ({
      uid,
      name: namesByUid.get(uid)?.name ?? uid,
      role: namesByUid.get(uid)?.role ?? 'accountant',
      totalPaise,
      count,
    }))
    .sort((a, b) => b.totalPaise - a.totalPaise)
}

/**
 * Per-collector (per-staff) totals for today and the last 7 days — a
 * "collector" is just whichever staff member's uid is on the payment
 * (createdByUid), not a separate tracked identity. One range query covers
 * both periods (today is a client-side-filtered subset of the week's data).
 *
 * Name resolution: `users` collection rules only let admins list every staff
 * doc (accountants can only read their own) — so `fetchUsers()` is only
 * called for admins. Accountants only ever render their own row anyway
 * (filtered client-side by the caller), so their own session name covers it;
 * other collectors' rows just fall back to their uid, which is never shown.
 */
export function useCollectorSummary() {
  const session = useAuthStore((s) => s.session)
  const [today, setToday] = useState<CollectorRow[]>([])
  const [week, setWeek] = useState<CollectorRow[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!session) return
    setLoading(true)
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - 6)

    const [payments, users] = await Promise.all([
      fetchPaymentsSince(startOfWeek),
      session.role === 'admin' ? fetchUsers() : Promise.resolve([]),
    ])

    const namesByUid = new Map(users.map((u) => [u.uid, { name: u.name, role: u.role }]))
    if (!namesByUid.has(session.uid)) {
      namesByUid.set(session.uid, { name: session.name, role: session.role })
    }
    const todayPayments = payments.filter((p) => (p.createdAt?.toDate?.() ?? new Date()) >= startOfToday)

    setToday(groupByCollector(todayPayments, namesByUid))
    setWeek(groupByCollector(payments, namesByUid))
    setLoading(false)
  }, [session])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { today, week, loading, refresh }
}
