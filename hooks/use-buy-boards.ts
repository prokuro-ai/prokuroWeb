'use client'

import { useEffect, useState } from 'react'
import { getBom, listBoms } from '@/lib/api'
import type { Board } from '@/lib/cart'

export const BUY_BOARD_LIMIT = 12

/** Most recent boards with their analyzed lines. One failed board does not hide the rest. */
export function useBuyBoards() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [failed, setFailed] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const page = await listBoms({ limit: BUY_BOARD_LIMIT })
        const summaries = [...page.items]
          .sort((a, b) => (b.updatedAt ?? b.uploadedAt).localeCompare(a.updatedAt ?? a.uploadedAt))
          .slice(0, BUY_BOARD_LIMIT)
        const results = await Promise.allSettled(summaries.map((summary) => getBom(summary.id)))
        if (cancelled) return
        const loaded: Board[] = []
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            loaded.push({ id: summaries[index].id, name: summaries[index].name, lines: result.value.analyze.lines })
          }
        })
        setBoards(loaded)
        setFailed(results.length - loaded.length)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your boards')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { boards, loading, error, failed }
}
