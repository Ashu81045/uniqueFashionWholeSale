import { useEffect, useState } from 'react'
import { queryProductSuggestionsByPrefix } from '../lib/products/queryProductSuggestions'
import type { ProductSuggestion } from '../types/productSuggestion'

export function useProductSuggestions(text: string, debounceMs = 300): ProductSuggestion[] {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])

  useEffect(() => {
    if (!text.trim()) {
      setSuggestions([])
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      const results = await queryProductSuggestionsByPrefix(text)
      if (!cancelled) setSuggestions(results)
    }, debounceMs)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [text, debounceMs])

  return suggestions
}
