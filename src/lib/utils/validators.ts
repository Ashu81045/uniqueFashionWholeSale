const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/

export function isValidIndianMobile(value: string): boolean {
  return INDIAN_MOBILE_RE.test(value.trim())
}
