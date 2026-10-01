import { NavLink } from 'react-router-dom'
import { BookOpen, LayoutDashboard, Receipt, ReceiptText, UserCircle } from 'lucide-react'
import { useT } from '../../i18n/I18nContext'

const items = [
  { to: '/', labelKey: 'nav.newBill', Icon: ReceiptText },
  { to: '/bills', labelKey: 'nav.bills', Icon: Receipt },
  { to: '/ledger', labelKey: 'nav.ledger', Icon: BookOpen },
  { to: '/dashboard', labelKey: 'nav.dashboard', Icon: LayoutDashboard },
  { to: '/profile', labelKey: 'nav.profile', Icon: UserCircle },
] as const

export function MobileNav() {
  const t = useT()
  return (
    <nav className="no-print pb-safe fixed inset-x-0 bottom-0 z-10 flex rounded-t-2xl border-t border-slate-200 bg-slate-50/95 shadow-[0_-4px_16px_rgba(0,0,0,0.4)] backdrop-blur-sm md:hidden">
      {items.map(({ to, labelKey, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 pt-2.5 pb-1.5 text-xs font-medium transition-colors duration-150 ${
              isActive ? 'text-blue-400' : 'text-slate-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 ${
                  isActive ? 'bg-blue-950/60' : ''
                }`}
              >
                <Icon size={18} />
              </span>
              {t(labelKey)}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
