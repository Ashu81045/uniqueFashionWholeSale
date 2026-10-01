import { useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { useT } from '../../../i18n/I18nContext'
import { createStaffUser } from '../userService'
import type { UserRole } from '../../../types/user'

export function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const t = useT()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('accountant')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSave = name.trim() && email.trim() && password.length >= 6 && !saving

  async function handleCreate() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      await createStaffUser(name.trim(), email.trim(), password, role)
      onCreated()
    } catch {
      setError(t('auth.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('users.addUser')} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Input label={t('users.name')} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Input
          label={t('users.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label={t('users.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="min 6 characters"
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">{t('users.role')}</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="min-h-11 rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="accountant">{t('users.roleAccountant')}</option>
            <option value="admin">{t('users.roleAdmin')}</option>
          </select>
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={!canSave}>
            {saving ? <Spinner tone="dark" /> : t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
