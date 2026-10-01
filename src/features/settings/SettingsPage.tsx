import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, CheckCircle2 } from 'lucide-react'
import { useT } from '../../i18n/I18nContext'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { useBusinessSettings, invalidateBusinessSettingsCache } from '../../hooks/useBusinessSettings'
import { numberInputValue, parseNumberInput } from '../../lib/utils/number'
import { saveBusinessSettings } from './settingsService'
import type { BusinessSettings } from '../../types/settings'

const EMPTY_SETTINGS: BusinessSettings = {
  businessName: '',
  address: '',
  phone: '',
  whatsappNumber: '',
  gstNumber: '',
  invoiceFooter: '',
  defaultOverallDiscountPct: 0,
  thermalPrinterWidthMm: 80,
}

export function SettingsPage() {
  const t = useT()
  const { settings, loading } = useBusinessSettings()
  const [form, setForm] = useState<BusinessSettings>(EMPTY_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  function update<K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveBusinessSettings(form)
      invalidateBusinessSettingsCache()
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex animate-fade-in flex-col gap-4 p-4">
      <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <SettingsIcon size={20} className="text-blue-600" />
        {t('settings.title')}
      </h1>

      <Card className="flex max-w-xl flex-col gap-4 p-4">
        <Input
          label={t('settings.businessName')}
          value={form.businessName}
          onChange={(e) => update('businessName', e.target.value)}
        />
        <Input
          label={t('settings.address')}
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('settings.phone')}
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
          <Input
            label={t('settings.whatsappNumber')}
            value={form.whatsappNumber}
            onChange={(e) => update('whatsappNumber', e.target.value)}
          />
        </div>
        <Input
          label={t('settings.gstNumber')}
          value={form.gstNumber ?? ''}
          onChange={(e) => update('gstNumber', e.target.value)}
        />
        <Input
          label={t('settings.invoiceFooter')}
          value={form.invoiceFooter}
          onChange={(e) => update('invoiceFooter', e.target.value)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="number"
            min={0}
            max={100}
            label={t('settings.defaultDiscount')}
            value={numberInputValue(form.defaultOverallDiscountPct)}
            onChange={(e) => update('defaultOverallDiscountPct', parseNumberInput(e.target.value))}
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">{t('settings.thermalWidth')}</span>
            <select
              value={form.thermalPrinterWidthMm}
              onChange={(e) => update('thermalPrinterWidthMm', Number(e.target.value) as 58 | 80)}
              className="min-h-11 rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value={58}>58mm</option>
              <option value={80}>80mm</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Spinner tone="dark" /> : t('common.save')}
          </Button>
          {saved && (
            <span className="flex animate-fade-in items-center gap-1.5 text-sm text-green-400">
              <CheckCircle2 size={16} />
              {t('settings.saved')}
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}
