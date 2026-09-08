import type { TeamRole } from '@/lib/api'

export function planName(provisioned: boolean | undefined) {
  if (provisioned) return 'Enabled'
  return 'Waiting for access'
}

export function inviteDeliveryNotice(invite: {
  email: string
  email_delivery?: string
  email_error?: string | null
}) {
  switch (invite.email_delivery) {
    case 'sent':
      return `Invite email sent to ${invite.email}.`
    case 'queued':
      return `Invite queued for ${invite.email}. Copy the link below if it does not arrive.`
    case 'failed':
      return invite.email_error
        ? `Invite created but email failed: ${invite.email_error}. Copy the link below.`
        : 'Invite created but email delivery failed. Copy the link below.'
    default:
      return 'Invite created. Copy the link below and share it with your teammate.'
  }
}

export function roleLabel(role: TeamRole) {
  if (role === 'read_only') return 'Can view'
  if (role === 'admin') return 'Can edit'
  if (role === 'owner') return 'Owner'
  return String(role)
}

export function memberDisplayName(member: {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  user_id: string
}) {
  const full = [member.first_name, member.last_name]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part) && part !== '-')
    .join(' ')
  return full || member.email || member.user_id
}

export function memberInitials(member: {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  user_id: string
}) {
  const first = member.first_name?.trim()
  const last = member.last_name?.trim()
  if ((first && first !== '-') || (last && last !== '-')) {
    return [first?.[0], last?.[0]].filter(Boolean).join('').toUpperCase() || '?'
  }
  const value = member.email ?? member.user_id
  const local = value.split('@')[0] ?? value
  const parts = local.split(/[.\s_-]+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  return local.slice(0, 2).toUpperCase() || '?'
}
