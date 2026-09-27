'use client'

import { useEffect, useState } from 'react'
import { listFlaggedLines } from '@/lib/api'
import { EMPTY_ACCOUNT_SITUATION, type AccountSituation, type FlaggedLineItem } from '@/lib/types'

export function useFlaggedLines() {
  const [items, setItems] = useState<FlaggedLineItem[]>([])
  const [total, setTotal] = useState(0)
  const [situation, setSituation] = useState<AccountSituation>(EMPTY_ACCOUNT_SITUATION)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    function load(initial: boolean) {
      if (initial) setLoading(true)
      setError(null)
      listFlaggedLines()
        .then((result) => {
          if (!cancelled) {
            setItems(result.items)
            setTotal(result.total ?? result.items.length)
            setSituation(result.situation ?? EMPTY_ACCOUNT_SITUATION)
            setError(null)
          }
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

  return { items, total, situation, loading, error }
}
