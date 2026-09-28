'use client'

import { useEffect, useState } from 'react'
import { listFlaggedLines } from '@/lib/api'
import type { FlaggedLines } from '@/lib/types'

export function useFlaggedLines() {
  const [feed, setFeed] = useState<FlaggedLines | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    function load(initial: boolean) {
      if (initial) setLoading(true)
      listFlaggedLines()
        .then((result) => {
          if (cancelled) return
          if (!result.account || !Array.isArray(result.boards)) {
            setError('The server has not been updated for this page yet. Try again in a few minutes.')
            return
          }
          setFeed(result)
          setError(null)
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to load this week’s calls')
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

  return { feed, loading, error }
}
