'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { listBoms } from '@/lib/api'
import type { BomSummary } from '@/lib/types'

interface PortfolioContextValue {
  boms: BomSummary[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  removeBom: (id: string) => void
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null)

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [boms, setBoms] = useState<BomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setBoms([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const all: BomSummary[] = []
      let token: string | null | undefined
      do {
        const page = await listBoms(token ? { next_token: token } : undefined)
        all.push(...page.items)
        token = page.next_token
      } while (token)
      setBoms(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load BOMs')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    void refresh()
  }, [authLoading, refresh])

  const removeBom = useCallback((id: string) => {
    setBoms((prev) => prev.filter((bom) => bom.id !== id))
  }, [])

  const value = useMemo(
    () => ({ boms, loading, error, refresh, removeBom }),
    [boms, loading, error, refresh, removeBom],
  )

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolio() {
  const context = useContext(PortfolioContext)
  if (!context) {
    throw new Error('usePortfolio must be used within PortfolioProvider')
  }
  return context
}
