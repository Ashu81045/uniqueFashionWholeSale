import type { ReactNode } from 'react'
import { useAuthStore } from '../../stores/authStore'
import type { UserRole } from '../../types/user'

/** Renders children only if the current session's role is in `roles`. */
export function RoleGate({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const role = useAuthStore((s) => s.session?.role)
  if (!role || !roles.includes(role)) return null
  return <>{children}</>
}
