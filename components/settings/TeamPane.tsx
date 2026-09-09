'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { appField, appPrimaryBtn } from '@/components/app/chrome'
import { useTeam } from '@/hooks/use-team'
import {
  createTeamInvite,
  patchTeamMemberRole,
  removeTeamMember,
  revokeTeamInvite,
  type TeamInvite,
  type TeamRole,
} from '@/lib/api'
import { displayNameForUser, initialsForUser } from '@/lib/auth'
import { inviteDeliveryNotice, memberDisplayName, memberInitials, planName, roleLabel } from './helpers'

const roleField =
  'h-10 min-w-[10.5rem] shrink-0 rounded-[8px] border border-mk-line bg-mk-canvas px-3 text-[13px] text-mk-ink focus:border-mk-accent focus:outline-none'

export default function TeamPane() {
  const { user } = useAuth()
  const { team, reload: reloadTeam, canManage, canInvite, error: teamError } = useTeam()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Exclude<TeamRole, 'owner'>>('read_only')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteNotice, setInviteNotice] = useState<string | null>(null)
  const [lastAcceptUrl, setLastAcceptUrl] = useState<string | null>(null)

  if (!user) return null

  const initials = initialsForUser(user)
  const displayName = displayNameForUser(user)
  const seatsUsed = team?.seats.used

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-mk-ink-muted">
        {planName(true)}
        {seatsUsed != null ? ` · ${seatsUsed} ${seatsUsed === 1 ? 'person' : 'people'} on the account` : ''}
        {!canInvite ? '. Only owners and editors can invite people.' : '.'}
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

      <div className="divide-y divide-mk-line overflow-hidden rounded-[8px] bg-mk-raised">
        {(team?.members ?? []).map((member) => (
          <div key={member.user_id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-mk-ink text-xs font-semibold text-mk-canvas">
              {memberInitials(member)}
            </div>
            <div className="min-w-0 flex-1 basis-[12rem]">
              <p className="truncate text-[13px] font-medium text-mk-ink">
                {memberDisplayName(member)}
                {member.user_id === team?.user_id ? ' (you)' : ''}
              </p>
              <p className="truncate text-[11px] text-mk-ink-subtle">{member.email || member.user_id}</p>
            </div>
            {canManage && member.role !== 'owner' ? (
              <select
                aria-label={`Role for ${memberDisplayName(member)}`}
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
                className={roleField}
              >
                <option value="read_only">Can view</option>
                <option value="admin">Can edit</option>
              </select>
            ) : (
              <span className="shrink-0 text-[13px] text-mk-ink-muted">{roleLabel(member.role)}</span>
            )}
            {canManage && member.role !== 'owner' ? (
              <button
                type="button"
                className="shrink-0 text-[13px] font-medium text-mk-ink-subtle hover:text-mk-red"
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
            <span className="shrink-0 text-[13px] text-mk-ink-muted">Owner</span>
          </div>
        ) : null}

        {(team?.invites ?? []).map((invite: TeamInvite) => (
          <div key={invite.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-mk-amber/15 text-[10px] font-bold text-mk-amber">
              …
            </div>
            <div className="min-w-0 flex-1 basis-[12rem]">
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
                className="shrink-0 text-[13px] font-medium text-mk-ink-subtle hover:text-mk-red"
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
        <div className="space-y-4">
          <div>
            <p className="text-[13px] font-medium text-mk-ink">Invite someone</p>
            <p className="mt-1 text-[12px] text-mk-ink-muted">
              They get an email with a link. Copy it yourself if the mail is slow.
            </p>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-mk-ink-subtle">Work email</span>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className={appField}
              />
            </label>
            <div className="flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-mk-ink-subtle">Access</span>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Exclude<TeamRole, 'owner'>)}
                  className={roleField}
                >
                  <option value="read_only">Can view</option>
                  <option value="admin">Can edit</option>
                </select>
              </label>
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
                className={`${appPrimaryBtn} shrink-0`}
              >
                {inviteBusy ? 'Sending…' : 'Invite'}
              </button>
            </div>
          </div>
          {inviteNotice ? <p className="text-[12px] text-mk-green">{inviteNotice}</p> : null}
          {inviteError ? <p className="text-[12px] text-mk-red">{inviteError}</p> : null}
          {lastAcceptUrl ? (
            <div className="rounded-[8px] bg-mk-raised px-3 py-2">
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
