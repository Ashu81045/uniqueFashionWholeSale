import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'
import { MobileNav } from './MobileNav'

export function AppShell() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950/30 via-slate-50 to-slate-50">
      <TopNav />
      <main className="mx-auto max-w-6xl animate-fade-in pb-24 md:pb-6">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
