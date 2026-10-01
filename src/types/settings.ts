/** settings/business — single seeded doc, editable by admins via the Settings page. */
export interface BusinessSettings {
  businessName: string
  address: string
  phone: string
  whatsappNumber: string
  gstNumber?: string
  invoiceFooter: string
  defaultOverallDiscountPct: number
  thermalPrinterWidthMm: 58 | 80
}

export const BUSINESS_SETTINGS_DOC_ID = 'business'
