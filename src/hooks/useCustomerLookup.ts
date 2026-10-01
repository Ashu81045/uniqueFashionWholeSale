import { useEffect, useState } from 'react'
import { getCustomerByMobile } from '../features/customers/customerService'
import type { Customer } from '../types/customer'
import { isValidIndianMobile } from '../lib/utils/validators'

interface UseCustomerLookupResult {
  customer: Customer | null
  loading: boolean
  notFound: boolean
}

/** Looks up a customer by mobile number, debounced so it only fires once typing settles. */
export function useCustomerLookup(mobile: string, debounceMs = 400): UseCustomerLookupResult {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!isValidIndianMobile(mobile)) {
      setCustomer(null)
      setNotFound(false)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      const result = await getCustomerByMobile(mobile)
      if (cancelled) return
      setCustomer(result)
      setNotFound(result === null)
      setLoading(false)
    }, debounceMs)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [mobile, debounceMs])

  return { customer, loading, notFound }
}
