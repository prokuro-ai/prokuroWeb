'use client'

import { useEffect, useState } from 'react'
import { listBoms } from '@/lib/api'
import type { BomSummary } from '@/lib/types'

export function useBoms() {
  const [boms, setBoms] = useState<BomSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listBoms()
      .then((result) => {
        if (!cancelled) setBoms(result.items)
      })
      .catch(() => {
        /* keep empty list */
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { boms, setBoms, loading }
}
