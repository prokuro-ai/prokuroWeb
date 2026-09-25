'use client'

import { useEffect, useState } from 'react'
import { listBoms } from '@/lib/api'
import type { BomSummary } from '@/lib/types'

export function useBoms() {
  const [boms, setBoms] = useState<BomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    function load(initial: boolean) {
      if (initial) setLoading(true)
      setError(null)
      listBoms()
        .then((result) => {
          if (!cancelled) {
            setBoms(result.items)
            setError(null)
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to load BOMs')
          }
        })
        .finally(() => {
          if (!cancelled && initial) setLoading(false)
        })
    }
    load(true)
    function onFocus() {
      load(false)
    }
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  return { boms, setBoms, loading, error }
}
