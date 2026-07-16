import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export type SectionKey = 'community' | 'grading' | 'raffles' | 'live' | 'chat' | 'aprende'
export type SectionsConfig = Record<SectionKey, boolean>

export const DEFAULT_SECTIONS: SectionsConfig = {
  community: true,
  grading:   true,
  raffles:   true,
  live:      true,
  chat:      true,
  aprende:   true,
}

const SectionsContext = createContext<SectionsConfig>(DEFAULT_SECTIONS)

export function SectionsProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<SectionsConfig>(DEFAULT_SECTIONS)

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'sections').maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try { setSections({ ...DEFAULT_SECTIONS, ...JSON.parse(data.value) }) } catch { /* noop */ }
        }
      })
  }, [])

  return <SectionsContext.Provider value={sections}>{children}</SectionsContext.Provider>
}

export function useSections() {
  return useContext(SectionsContext)
}
