'use client'

import { useCallback, useEffect, useState } from 'react'
import { getTeam, type TeamSnapshot } from '@/lib/api'

export function useTeam() {
  const [team, setTeam] = useState<TeamSnapshot | null>(null)

  const reload = useCallback(() => {
    getTeam()
      .then(setTeam)
      .catch(() => {})
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return {
    team,
    reload,
    canWrite: team?.role !== 'read_only',
    canManage: team?.role === 'owner' || team?.role === 'admin',
  }
}
