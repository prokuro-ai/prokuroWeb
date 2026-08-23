'use client'

import { useCallback, useEffect, useState } from 'react'
import { getTeam, type TeamRole, type TeamSnapshot } from '@/lib/api'

function normalizeRole(role: unknown): TeamRole | null {
  if (role === 'owner' || role === 'admin' || role === 'read_only') return role
  if (typeof role === 'string') {
    const lower = role.toLowerCase()
    if (lower === 'owner' || lower === 'admin' || lower === 'read_only') {
      return lower
    }
  }
  return null
}

export function useTeam() {
  const [team, setTeam] = useState<TeamSnapshot | null>(null)
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(() => {
    getTeam()
      .then((snapshot) => {
        const role = normalizeRole(snapshot.role) ?? 'owner'
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        setTeam({
          ...snapshot,
          role,
          members: (snapshot.members ?? []).map((member) => ({
            ...member,
            role: normalizeRole(member.role) ?? member.role,
          })),
          invites: (snapshot.invites ?? []).map((invite) => ({
            ...invite,
            role: normalizeRole(invite.role) ?? invite.role,
            accept_url:
              invite.accept_url ||
              (origin && invite.id
                ? `${origin}/invite/accept?token=${encodeURIComponent(invite.id)}`
                : undefined),
          })),
        })
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const role = team?.role
  const canManage = loaded && (role === 'owner' || role === 'admin')
  const seatsUsed = team?.seats.used ?? 1
  const seatsLimit = team?.seats.limit ?? 1
  const canInvite =
    canManage && team?.plan !== 'free' && seatsUsed < seatsLimit

  return {
    team,
    loaded,
    reload,
    canWrite: loaded && role !== 'read_only',
    canManage,
    canInvite,
    seatsUsed,
    seatsLimit,
  }
}
