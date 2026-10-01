import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '../types/user'

interface AuthSession {
  uid: string
  name: string
  role: UserRole
}

interface AuthState {
  session: AuthSession | null
  status: 'idle' | 'loading' | 'ready'
  setSession: (session: AuthSession | null) => void
  setStatus: (status: AuthState['status']) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      status: 'idle',
      setSession: (session) => set({ session }),
      setStatus: (status) => set({ status }),
      clear: () => set({ session: null, status: 'idle' }),
    }),
    { name: 'uf-auth-store', partialize: (s) => ({ session: s.session }) },
  ),
)
