import { Link } from 'react-router-dom'
import { HandCoins, LogOut, Settings, UserCog, ChevronRight, Languages } from 'lucide-react'
import { useT } from '../../i18n/I18nContext'
import { useUiStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { signOut } from '../../firebase/auth'
import { RoleGate } from '../../components/layout/RoleGate'
import { Card } from '../../components/ui/Card'

function MenuLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200/60 first:rounded-t-xl last:rounded-b-xl"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-950/50 text-blue-400">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      <ChevronRight size={16} className="text-slate-400" />
    </Link>
  )
}

export function ProfilePage() {
  const t = useT()
  const language = useUiStore((s) => s.language)
  const setLanguage = useUiStore((s) => s.setLanguage)
  const session = useAuthStore((s) => s.session)

  return (
    <div className="flex animate-fade-in flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold text-slate-900">{t('nav.profile')}</h1>

      <Card className="flex items-center gap-3 p-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-950/50 text-lg font-semibold text-blue-400">
          {session?.name?.[0]?.toUpperCase() ?? '?'}
        </span>
        <div>
          <p className="font-medium text-slate-900">{session?.name}</p>
          <p className="text-sm capitalize text-slate-500">{session?.role}</p>
        </div>
      </Card>

      <Card className="divide-y divide-slate-200 overflow-hidden p-0">
        <MenuLink to="/collections" icon={<HandCoins size={16} />} label={t('dashboard.collections')} />
        <RoleGate roles={['admin']}>
          <MenuLink to="/settings" icon={<Settings size={16} />} label={t('nav.settings')} />
        </RoleGate>
        <RoleGate roles={['admin']}>
          <MenuLink to="/users" icon={<UserCog size={16} />} label={t('nav.users')} />
        </RoleGate>
      </Card>

      <Card className="flex items-center justify-between p-4">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Languages size={16} className="text-slate-400" />
          {language === 'hi' ? 'English' : 'Hinglish'}
        </span>
        <button
          onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-blue-500 hover:bg-blue-950/40 hover:text-blue-400"
        >
          {language === 'hi' ? 'English' : 'Hinglish'}
        </button>
      </Card>

      <button
        onClick={() => signOut()}
        className="flex items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-950/40"
      >
        <LogOut size={16} />
        {t('nav.logout')}
      </button>
    </div>
  )
}
