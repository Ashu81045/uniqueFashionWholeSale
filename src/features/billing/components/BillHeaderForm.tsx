import { Calendar } from 'lucide-react'
import { useT } from '../../../i18n/I18nContext'
import { formatDisplayDate } from '../../../lib/utils/date'
import { Card } from '../../../components/ui/Card'
import { CustomerLookupField } from '../../customers/CustomerLookupField'
import type { Customer } from '../../../types/customer'

export function BillHeaderForm({
  selectedCustomer,
  onCustomerSelect,
}: {
  selectedCustomer?: Customer | null
  onCustomerSelect: (customer: Customer | null) => void
}) {
  const t = useT()
  return (
    <Card className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} />
          {t('bill.date')}
        </span>
        <span className="font-medium text-slate-700">{formatDisplayDate(new Date())}</span>
      </div>
      <CustomerLookupField selectedCustomer={selectedCustomer} onSelect={onCustomerSelect} />
    </Card>
  )
}
