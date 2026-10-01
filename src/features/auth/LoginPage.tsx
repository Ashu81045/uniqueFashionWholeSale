import { Navigate } from 'react-router-dom'
import { useT } from '../../i18n/I18nContext'
import { useAuthStore } from '../../stores/authStore'
import { Card } from '../../components/ui/Card'
import { LoginForm } from './components/LoginForm'

export function LoginPage() {
  const t = useT()
  const session = useAuthStore((s) => s.session)

  if (session) return <Navigate to="/" replace />

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-gradient-to-b from-blue-950/40 via-slate-50 to-slate-50 px-4">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-400/25 blur-3xl" />

      <div className="relative flex animate-slide-up flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-xl font-bold text-slate-50 shadow-lg shadow-black/40">
          UF
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('app.name')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('auth.login')}</p>
        </div>
      </div>

      <Card className="relative w-full max-w-sm animate-slide-up p-6">
        <LoginForm />
      </Card>
    </div>
  )
}
