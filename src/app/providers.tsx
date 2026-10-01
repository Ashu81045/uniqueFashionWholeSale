import type { ReactNode } from 'react'
import { I18nProvider } from '../i18n/I18nContext'
import { useAuthSession } from '../hooks/useAuthSession'

function AuthBootstrap() {
  useAuthSession()
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AuthBootstrap />
      {children}
    </I18nProvider>
  )
}
