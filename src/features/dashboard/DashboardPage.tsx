import { useAuthStore } from '../../stores/authStore'
import { AccountantDashboardPage } from './AccountantDashboardPage'
import { AdminDashboardPage } from './AdminDashboardPage'

export function DashboardPage() {
  const role = useAuthStore((s) => s.session?.role)
  return role === 'admin' ? <AdminDashboardPage /> : <AccountantDashboardPage />
}
