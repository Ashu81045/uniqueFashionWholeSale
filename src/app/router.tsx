import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Spinner } from '../components/ui/Spinner'
import { AppShell } from '../components/layout/AppShell'
import { LoginPage } from '../features/auth/LoginPage'
import { NewBillPage } from '../features/billing/NewBillPage'
import { BillsListPage } from '../features/bills/BillsListPage'
import { BillDetailPage } from '../features/bills/BillDetailPage'
import { CustomerLedgerPage } from '../features/ledger/CustomerLedgerPage'
import { LedgerPage } from '../features/ledger/LedgerPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { UsersPage } from '../features/users/UsersPage'
import { CollectionsPage } from '../features/collections/CollectionsPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { DayClosePage } from '../features/dayClose/DayClosePage'

function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status)
  const session = useAuthStore((s) => s.session)

  if (status !== 'ready') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Nested inside RequireAuth — assumes a session already exists, only checks role. */
function RequireAdmin({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.session?.role)
  if (role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<NewBillPage />} />
          <Route path="/bills/new" element={<Navigate to="/" replace />} />
          <Route path="/bills" element={<BillsListPage />} />
          <Route path="/bills/:billId" element={<BillDetailPage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/ledger/:mobile" element={<CustomerLedgerPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/day-close" element={<DayClosePage />} />
          <Route path="/day-close/:date" element={<DayClosePage />} />
          <Route
            path="/settings"
            element={
              <RequireAdmin>
                <SettingsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/users"
            element={
              <RequireAdmin>
                <UsersPage />
              </RequireAdmin>
            }
          />
          {/* Both roles can log/view collections — rules already allow any
              active staff to read the payments collection-group. */}
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
