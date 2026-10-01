import { useEffect, useState } from 'react'
import { UserPlus, Users as UsersIcon } from 'lucide-react'
import { useT } from '../../i18n/I18nContext'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'
import { fetchUsers, setUserActive, updateUserRole } from './userService'
import { CreateUserModal } from './components/CreateUserModal'
import type { AppUser, UserRole } from '../../types/user'

export function UsersPage() {
  const t = useT()
  const currentUid = useAuthStore((s) => s.session?.uid)
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  function load() {
    setLoading(true)
    fetchUsers()
      .then(setUsers)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleRoleChange(uid: string, role: UserRole) {
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)))
    await updateUserRole(uid, role)
  }

  async function handleActiveToggle(uid: string, active: boolean) {
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, active } : u)))
    await setUserActive(uid, active)
  }

  return (
    <div className="flex animate-fade-in flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <UsersIcon size={20} className="text-blue-600" />
          {t('users.title')}
        </h1>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus size={16} />
          {t('users.addUser')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <Card className="flex flex-col divide-y divide-slate-200 overflow-hidden p-0">
          {users.map((u) => (
            <div key={u.uid} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-950/50 text-sm font-semibold text-blue-400">
                {u.name[0]?.toUpperCase() ?? '?'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{u.name}</p>
                <p className="truncate text-xs text-slate-500">{u.email || '—'}</p>
              </div>
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                disabled={u.uid === currentUid}
                className="min-h-9 rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="accountant">{t('users.roleAccountant')}</option>
                <option value="admin">{t('users.roleAdmin')}</option>
              </select>
              <button
                type="button"
                onClick={() => handleActiveToggle(u.uid, !u.active)}
                disabled={u.uid === currentUid}
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Badge tone={u.active ? 'green' : 'slate'}>
                  {u.active ? t('users.active') : t('users.inactive')}
                </Badge>
              </button>
            </div>
          ))}
        </Card>
      )}

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            load()
          }}
        />
      )}
    </div>
  )
}
