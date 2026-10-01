import { useEffect, useState } from 'react'
import { CheckCircle2, UserPlus } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { useT } from '../../i18n/I18nContext'
import { useCustomerLookup } from '../../hooks/useCustomerLookup'
import { isValidIndianMobile } from '../../lib/utils/validators'
import { CustomerCreateModal } from './CustomerCreateModal'
import type { Customer } from '../../types/customer'
import { formatPaiseAsRupees } from '../../lib/billing/formatCurrency'

export function CustomerLookupField({
  selectedCustomer,
  onSelect,
}: {
  selectedCustomer?: Customer | null
  onSelect: (customer: Customer | null) => void
}) {
  const t = useT()
  const [mobile, setMobile] = useState(selectedCustomer?.mobile ?? '')
  const [showCreate, setShowCreate] = useState(false)
  const { customer, loading, notFound } = useCustomerLookup(mobile)

  useEffect(() => {
    if (selectedCustomer !== undefined) {
      setMobile(selectedCustomer?.mobile ?? '')
    }
  }, [selectedCustomer])

  useEffect(() => {
    if (customer) onSelect(customer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer])

  function handleMobileChange(value: string) {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
    setMobile(digitsOnly)
    onSelect(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          label={t('customer.lookup')}
          value={mobile}
          onChange={(e) => handleMobileChange(e.target.value)}
          inputMode="numeric"
          maxLength={10}
          placeholder="9876543210"
        />
        {loading && <Spinner className="absolute right-3 top-9" />}
      </div>

      {customer && (
        <div className="flex animate-fade-in items-start gap-2 rounded-lg border border-green-700/50 bg-green-950/40 px-3 py-2 text-sm">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-400" />
          <div>
            <p className="font-medium text-green-300">{customer.name}</p>
            <p className="text-green-500">
              {t('ledger.outstandingBalance')}: {formatPaiseAsRupees(customer.outstandingBalancePaise)}
            </p>
          </div>
        </div>
      )}

      {notFound && isValidIndianMobile(mobile) && !customer && (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex animate-fade-in items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-left text-sm text-blue-400 transition-colors hover:border-blue-500 hover:bg-blue-950/40"
        >
          <UserPlus size={16} className="shrink-0" />
          {t('customer.notFound')} — {t('customer.createNew')}
        </button>
      )}

      {showCreate && (
        <CustomerCreateModal
          mobile={mobile}
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            setShowCreate(false)
            onSelect(created)
          }}
        />
      )}
    </div>
  )
}
