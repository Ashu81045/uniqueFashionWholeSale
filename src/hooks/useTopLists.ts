import { useEffect, useState } from 'react'
import { queryTopCustomers } from '../features/customers/customersQuery'
import { queryTopProducts } from '../lib/products/queryProductSuggestions'
import type { TopListRow } from '../features/dashboard/components/TopList'

export function useTopLists() {
  const [topCustomers, setTopCustomers] = useState<TopListRow[]>([])
  const [topProducts, setTopProducts] = useState<TopListRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([queryTopCustomers(), queryTopProducts()]).then(([customers, products]) => {
      if (cancelled) return
      setTopCustomers(
        customers.map((c) => ({ key: c.mobile, label: c.name, valuePaise: c.totalSpentPaise })),
      )
      setTopProducts(
        products.map((p) => ({ key: p.nameLower, label: p.name, valuePaise: p.totalRevenuePaise })),
      )
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { topCustomers, topProducts, loading }
}
