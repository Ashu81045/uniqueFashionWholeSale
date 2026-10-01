import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useT } from '../../i18n/I18nContext'
import { createCustomer } from './customerService'
import { useAuthStore } from '../../stores/authStore'
import type { Customer } from '../../types/customer'

export function CustomerCreateModal({
  mobile,
  onClose,
  onCreated,
}: {
  mobile: string
  onClose: () => void
  onCreated: (customer: Customer) => void
}) {
  const t = useT()
  const uid = useAuthStore((s) => s.session?.uid)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!name.trim() || !uid) return
    setSaving(true)
    try {
      const customer = await createCustomer(mobile, name.trim(), uid)
      onCreated(customer)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('customer.createNew')} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Input label={t('common.mobile')} value={mobile} disabled />
        <Input
          label={t('customer.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={saving || !name.trim()}>
            {saving ? <Spinner tone="dark" /> : t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
