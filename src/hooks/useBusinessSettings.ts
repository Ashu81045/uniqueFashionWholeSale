import { useEffect, useState } from 'react'
import { fetchBusinessSettings } from '../features/settings/settingsService'
import type { BusinessSettings } from '../types/settings'

// Module-level cache: settings rarely change and are read from several
// unrelated places (print layouts, PDF/WhatsApp share, the Settings page
// itself) — one shared in-memory copy avoids a Firestore read per read site.
let cache: BusinessSettings | null = null
let inflight: Promise<BusinessSettings | null> | null = null

async function load(): Promise<BusinessSettings | null> {
  if (cache) return cache
  if (!inflight) {
    inflight = fetchBusinessSettings().then((settings) => {
      cache = settings
      inflight = null
      return settings
    })
  }
  return inflight
}

/** Call after saving Settings so subsequent reads (including other tabs' hooks) refetch. */
export function invalidateBusinessSettingsCache() {
  cache = null
  inflight = null
}

/** Plain async accessor for non-component contexts (e.g. PDF generation) — same shared cache. */
export function getCachedBusinessSettings(): Promise<BusinessSettings | null> {
  return load()
}

export function useBusinessSettings() {
  const [settings, setSettings] = useState<BusinessSettings | null>(cache)
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache) return
    let cancelled = false
    setLoading(true)
    load().then((result) => {
      if (cancelled) return
      setSettings(result)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { settings, loading }
}
