import type { Timestamp } from 'firebase/firestore'

export type UserRole = 'admin' | 'accountant'

export interface AppUser {
  uid: string
  name: string
  /** Not stored on docs seeded before User Management existed — shows blank until edited. */
  email?: string
  role: UserRole
  phone?: string
  active: boolean
  createdAt: Timestamp
}
