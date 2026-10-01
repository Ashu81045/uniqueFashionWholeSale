import { Plus, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ProductNameInput } from './ProductNameInput'
import { useT } from '../../../i18n/I18nContext'
import { formatPaiseAsRupees, paiseToRupees, rupeesToPaise } from '../../../lib/billing/formatCurrency'
import { numberInputValue, parseNumberInput } from '../../../lib/utils/number'
import type { BillLineItemInput } from '../../../lib/billing/calculateBill'

function rowAmountPaise(item: BillLineItemInput): number {
  const amount = item.qty * item.ratePaise
  return Math.round(amount - (amount * item.itemDiscountPct) / 100)
}

const fieldClass =
  'min-h-9 rounded-md border border-slate-300 px-2 py-1.5 text-sm transition-shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30'

export function LineItemsTable({
  items,
  onChange,
}: {
  items: BillLineItemInput[]
  onChange: (items: BillLineItemInput[]) => void
}) {
  const t = useT()

  function updateItem(index: number, patch: Partial<BillLineItemInput>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    onChange([...items, { name: '', qty: 1, ratePaise: 0, itemDiscountPct: 0 }])
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Desktop/tablet: compact grid rows */}
      <div className="hidden gap-2 text-xs font-medium text-slate-500 sm:grid sm:grid-cols-[1fr_5rem_4rem_4rem_5rem_2.25rem]">
        <span>{t('bill.productName')}</span>
        <span>{t('bill.rate')}</span>
        <span>{t('bill.qty')}</span>
        <span>{t('bill.itemDiscount')}</span>
        <span>{t('bill.amount')}</span>
        <span />
      </div>

      <div className="flex flex-col gap-2 sm:hidden">
        {items.map((item, i) => (
          <Card key={i} className="animate-fade-in p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-950/50 text-xs font-semibold text-blue-400">
                {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="-m-1.5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-950/50 hover:text-red-400"
                aria-label={t('common.remove')}
              >
                <X size={16} />
              </button>
            </div>
            <ProductNameInput
              className={`${fieldClass} mb-2 w-full`}
              value={item.name}
              onChange={(name) => updateItem(i, { name })}
              placeholder={t('bill.productName')}
            />
            <div className="grid grid-cols-3 gap-2">
              <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                {t('bill.rate')}
                <input
                  type="number"
                  min={0}
                  className={fieldClass}
                  value={numberInputValue(paiseToRupees(item.ratePaise))}
                  onChange={(e) => updateItem(i, { ratePaise: rupeesToPaise(parseNumberInput(e.target.value)) })}
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                {t('bill.qty')}
                <input
                  type="number"
                  min={0}
                  className={fieldClass}
                  value={numberInputValue(item.qty)}
                  onChange={(e) => updateItem(i, { qty: parseNumberInput(e.target.value) })}
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                {t('bill.itemDiscount')}
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={fieldClass}
                  value={numberInputValue(item.itemDiscountPct)}
                  onChange={(e) => updateItem(i, { itemDiscountPct: parseNumberInput(e.target.value) })}
                />
              </label>
            </div>
            <p className="mt-2 text-right text-sm font-medium text-slate-700">
              {formatPaiseAsRupees(rowAmountPaise(item))}
            </p>
          </Card>
        ))}
      </div>

      <div className="hidden flex-col gap-2 sm:flex">
        {items.map((item, i) => (
          <div
            key={i}
            className="grid animate-fade-in grid-cols-[1fr_5rem_4rem_4rem_5rem_2.25rem] items-center gap-2"
          >
            <ProductNameInput
              className={fieldClass}
              value={item.name}
              onChange={(name) => updateItem(i, { name })}
              placeholder={t('bill.productName')}
            />
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={numberInputValue(paiseToRupees(item.ratePaise))}
              onChange={(e) => updateItem(i, { ratePaise: rupeesToPaise(parseNumberInput(e.target.value)) })}
            />
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={numberInputValue(item.qty)}
              onChange={(e) => updateItem(i, { qty: parseNumberInput(e.target.value) })}
            />
            <input
              type="number"
              min={0}
              max={100}
              className={fieldClass}
              value={numberInputValue(item.itemDiscountPct)}
              onChange={(e) => updateItem(i, { itemDiscountPct: parseNumberInput(e.target.value) })}
            />
            <span className="text-sm font-medium text-slate-700">
              {formatPaiseAsRupees(rowAmountPaise(item))}
            </span>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-950/50 hover:text-red-400"
              aria-label={t('common.remove')}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={addItem} className="self-start">
        <Plus size={16} />
        {t('common.add')}
      </Button>
    </div>
  )
}
