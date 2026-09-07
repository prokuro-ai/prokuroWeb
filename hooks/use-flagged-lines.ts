'use client'

import { useEffect, useState } from 'react'
import { listFlaggedLines } from '@/lib/api'
import type { FlaggedLineItem } from '@/lib/types'

export function useFlaggedLines() {
  const [items, setItems] = useState<FlaggedLineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listFlaggedLines()
      .then((result) => {
        if (!cancelled) {
          setItems(result.items)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load this week’s calls')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { items, loading, error }
}
