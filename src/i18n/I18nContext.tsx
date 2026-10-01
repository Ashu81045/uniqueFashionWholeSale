import { createContext, useContext, useMemo, type ReactNode } from 'react'
import en from './en.json'
import hi from './hi.json'
import { useUiStore } from '../stores/uiStore'

export type Language = 'en' | 'hi'

const dictionaries: Record<Language, Record<string, string>> = { en, hi }

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string

const I18nContext = createContext<TranslateFn>((key) => key)

export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useUiStore((s) => s.language)

  const t = useMemo<TranslateFn>(() => {
    const dict = dictionaries[language]
    return (key, vars) => {
      let str = dict[key] ?? key
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          str = str.replace(`{${name}}`, String(value))
        }
      }
      return str
    }
  }, [language])

  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- provider + its hook belong together
export function useT(): TranslateFn {
  return useContext(I18nContext)
}
