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
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const role = team?.role
  return {
    team,
    reload,
    canWrite: role !== 'read_only',
    // Default to manageable while team is loading so Invite UI is visible on Account.
    canManage: role !== 'read_only',
  }
}
