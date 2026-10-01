import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../i18n/I18nContext'

interface UiState {
  language: Language
  setLanguage: (language: Language) => void
  navCollapsed: boolean
  toggleNav: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      language: 'hi',
      setLanguage: (language) => set({ language }),
      navCollapsed: false,
      toggleNav: () => set((s) => ({ navCollapsed: !s.navCollapsed })),
    }),
    { name: 'uf-ui-store', partialize: (s) => ({ language: s.language }) },
  ),
)
