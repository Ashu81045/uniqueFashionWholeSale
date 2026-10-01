import { NavLink } from 'react-router-dom'
import { BookOpen, FileCheck2, LayoutDashboard, Receipt, ReceiptText } from 'lucide-react'
import { useT } from '../../i18n/I18nContext'
import { useAuthStore } from '../../stores/authStore'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
    isActive ? 'bg-blue-950/50 text-blue-400' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

export function TopNav() {
  const t = useT()
  const session = useAuthStore((s) => s.session)

  return (
    <header className="no-print sticky top-0 z-10 hidden border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-slate-50 shadow-sm shadow-black/30">
            UF
          </span>
          <span className="text-base font-semibold text-slate-900">{t('app.name')}</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            <ReceiptText size={16} />
            {t('nav.newBill')}
          </NavLink>
          <NavLink to="/bills" className={linkClass}>
            <Receipt size={16} />
            {t('nav.bills')}
          </NavLink>
          <NavLink to="/ledger" className={linkClass}>
            <BookOpen size={16} />
            {t('nav.ledger')}
          </NavLink>
          <NavLink to="/dashboard" className={linkClass}>
            <LayoutDashboard size={16} />
            {t('nav.dashboard')}
          </NavLink>
          <NavLink to="/day-close" className={linkClass}>
            <FileCheck2 size={16} />
            <span>Day Close</span>
          </NavLink>
        </nav>
        <NavLink to="/profile" className={linkClass}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-950/50 text-xs font-semibold text-blue-400">
            {session?.name?.[0]?.toUpperCase() ?? '?'}
          </span>
          {t('nav.profile')}
        </NavLink>
      </div>
    </header>
  )
}
