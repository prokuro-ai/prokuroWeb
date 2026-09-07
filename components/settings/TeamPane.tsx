'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { appField, appPrimaryBtn } from '@/components/app/chrome'
import { useTeam } from '@/hooks/use-team'
import {
  createTeamInvite,
  getBillingStatus,
  patchTeamMemberRole,
  removeTeamMember,
  revokeTeamInvite,
  type BillingAccountStatus,
  type TeamInvite,
  type TeamRole,
} from '@/lib/api'
import { displayNameForUser, initialsForUser } from '@/lib/auth'
import { inviteDeliveryNotice, memberDisplayName, memberInitials, planName, roleLabel } from './helpers'

export default function TeamPane() {
  const { user } = useAuth()
  const { team, reload: reloadTeam, canManage, canInvite, error: teamError } = useTeam()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Exclude<TeamRole, 'owner'>>('read_only')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteNotice, setInviteNotice] = useState<string | null>(null)
  const [lastAcceptUrl, setLastAcceptUrl] = useState<string | null>(null)
  const [billing, setBilling] = useState<BillingAccountStatus | null>(null)

  useEffect(() => {
    getBillingStatus()
      .then(setBilling)
      .catch(() => setBilling(null))
  }, [])

  if (!user) return null

  const initials = initialsForUser(user)
  const displayName = displayNameForUser(user)
  const activePlan = billing?.plan
  const seatsLimit = team?.seats.limit ?? billing?.limits.seats
  const seatsUsed = team?.seats.used

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-mk-ink-muted">
        {planName(activePlan)}
        {seatsUsed != null ? ` · ${seatsUsed} of ${seatsLimit ?? '—'} seats` : ''}
        {team ? ` · you are ${roleLabel(team.role).toLowerCase()}` : ''}
        {!canInvite && activePlan === 'free'
          ? '. Upgrade before inviting people.'
          : !canInvite && seatsLimit != null && seatsUsed != null && seatsUsed >= seatsLimit
            ? '. All seats are in use — revoke a pending invite or add seats on Plan.'
            : '.'}
      </p>

      {teamError && !team ? (
        <p className="text-[12px] text-mk-amber">
          Could not load the team ({teamError}).{' '}
          <button type="button" className="font-semibold underline" onClick={() => reloadTeam()}>
            Retry
          </button>
        </p>
      ) : teamError ? (
        <p className="text-[12px] text-mk-amber">
          Team refresh failed ({teamError}).{' '}
          <button type="button" className="font-semibold underline" onClick={() => reloadTeam()}>
            Retry
          </button>
        </p>
      ) : null}

      <div className="divide-y divide-mk-line rounded-[8px] bg-mk-raised">
        {(team?.members ?? []).map((member) => (
          <div key={member.user_id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-mk-ink text-xs font-semibold text-mk-canvas">
              {memberInitials(member)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-mk-ink">
                {memberDisplayName(member)}
                {member.user_id === team?.user_id ? ' (you)' : ''}
              </p>
              <p className="truncate text-[11px] text-mk-ink-subtle">{member.email || member.user_id}</p>
            </div>
            {canManage && member.role !== 'owner' ? (
              <select
                value={member.role}
                onChange={async (e) => {
                  const role = e.target.value as Exclude<TeamRole, 'owner'>
                  try {
                    await patchTeamMemberRole(member.user_id, role)
                    await reloadTeam()
                  } catch (err) {
                    setInviteError(err instanceof Error ? err.message : 'Could not update role')
                  }
                }}
                className="rounded-[8px] border border-mk-line bg-mk-canvas px-2 py-0.5 text-[11px] text-mk-ink"
              >
                <option value="read_only">Can view</option>
                <option value="admin">Can edit</option>
              </select>
            ) : (
              <span className="px-2 py-0.5 text-[11px] text-mk-ink-muted">{roleLabel(member.role)}</span>
            )}
            {canManage && member.role !== 'owner' ? (
              <button
                type="button"
                className="text-[11px] font-medium text-mk-ink-subtle hover:text-mk-red"
                onClick={async () => {
                  try {
                    await removeTeamMember(member.user_id)
                    await reloadTeam()
                  } catch (err) {
                    setInviteError(err instanceof Error ? err.message : 'Could not remove member')
                  }
                }}
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}

        {!team?.members?.length ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-mk-ink text-xs font-semibold text-mk-canvas">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-mk-ink">{displayName || user.email}</p>
              <p className="truncate text-[11px] text-mk-ink-subtle">{user.email}</p>
            </div>
            <span className="text-[11px] text-mk-ink-muted">Owner</span>
          </div>
        ) : null}

        {(team?.invites ?? []).map((invite: TeamInvite) => (
          <div key={invite.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-mk-amber/15 text-[10px] font-bold text-mk-amber">
              …
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-mk-ink">{invite.email}</p>
              <p className="truncate text-[11px] text-mk-ink-subtle">
                Waiting · {roleLabel(invite.role)} · expires {new Date(invite.expires_at).toLocaleDateString()}
              </p>
              {invite.accept_url ? (
                <button
                  type="button"
                  className="mt-1 text-[11px] font-semibold text-mk-accent hover:underline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(invite.accept_url!)
                      setLastAcceptUrl(invite.accept_url!)
                    } catch {
                      setLastAcceptUrl(invite.accept_url!)
                    }
                  }}
                >
                  Copy invite link
                </button>
              ) : null}
            </div>
            {canManage ? (
              <button
                type="button"
                className="text-[11px] font-medium text-mk-ink-subtle hover:text-mk-red"
                onClick={async () => {
                  try {
                    await revokeTeamInvite(invite.id)
                    await reloadTeam()
                  } catch (err) {
                    setInviteError(err instanceof Error ? err.message : 'Could not revoke invite')
                  }
                }}
              >
                Revoke
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {canInvite ? (
        <div className="pt-1">
          <p className="mb-1 text-[13px] font-medium text-mk-ink">Invite someone</p>
          <p className="mb-3 text-[12px] text-mk-ink-muted">
            They get an email with a link. Copy it yourself if the mail is slow.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className={`${appField} flex-1`}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Exclude<TeamRole, 'owner'>)}
              className={appField}
            >
              <option value="read_only">Can view</option>
              <option value="admin">Can edit</option>
            </select>
            <button
              type="button"
              disabled={!inviteEmail.includes('@') || inviteBusy}
              onClick={async () => {
                setInviteBusy(true)
                setInviteError(null)
                setInviteNotice(null)
                setLastAcceptUrl(null)
                try {
                  const invite = await createTeamInvite(inviteEmail.trim(), inviteRole)
                  setInviteEmail('')
                  if (invite.accept_url) setLastAcceptUrl(invite.accept_url)
                  setInviteNotice(inviteDeliveryNotice(invite))
                  await reloadTeam()
                } catch (err) {
                  setInviteError(err instanceof Error ? err.message : 'Invite failed')
                } finally {
                  setInviteBusy(false)
                }
              }}
              className={appPrimaryBtn}
            >
              {inviteBusy ? 'Sending…' : 'Invite'}
            </button>
          </div>
          {inviteNotice ? <p className="mt-2 text-[12px] text-mk-green">{inviteNotice}</p> : null}
          {inviteError ? <p className="mt-2 text-[12px] text-mk-red">{inviteError}</p> : null}
          {lastAcceptUrl ? (
            <div className="mt-3 rounded-[8px] bg-mk-raised px-3 py-2">
              <p className="text-[11px] font-medium text-mk-ink-muted">Invite link</p>
              <a
                href={lastAcceptUrl}
                className="mt-1 block break-all text-[12px] font-medium text-mk-accent hover:underline"
              >
                {lastAcceptUrl}
              </a>
              <button
                type="button"
                className="mt-2 text-[11px] font-semibold text-mk-ink-muted hover:text-mk-accent"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(lastAcceptUrl)
                  } catch {
                    /* ignore */
                  }
                }}
              >
                Copy link
              </button>
            </div>
          ) : null}
        </div>
      ) : inviteError ? (
        <p className="text-[12px] text-mk-red">{inviteError}</p>
      ) : null}
    </div>
  )
}
