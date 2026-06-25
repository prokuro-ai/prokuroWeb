'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { configureAmplify } from '@/lib/amplify-config'
import { getAuthUser, type AuthUser } from '@/lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    configureAmplify()
    setUser(await getAuthUser())
  }, [])

  useEffect(() => {
    void (async () => {
      await refresh()
      setLoading(false)
    })()
  }, [refresh])

  const value = useMemo(() => ({ user, loading, refresh }), [user, loading, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
