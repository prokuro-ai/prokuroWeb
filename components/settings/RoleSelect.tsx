'use client'

import AppMenu from '@/components/app/AppMenu'
import type { TeamRole } from '@/lib/api'
import { roleLabel } from './helpers'

type AssignableRole = Exclude<TeamRole, 'owner'>

const ROLES: AssignableRole[] = ['read_only', 'admin']

export default function RoleSelect({
  value,
  onChange,
  label,
  align = 'end',
}: {
  value: AssignableRole
  onChange: (role: AssignableRole) => void
  label?: string
  align?: 'start' | 'end'
}) {
  return (
    <AppMenu
      label={roleLabel(value)}
      ariaLabel={label}
      align={align}
      triggerClassName="min-w-[10.5rem] justify-between"
      items={ROLES.map((role) => ({
        label: roleLabel(role),
        onSelect: () => onChange(role),
      }))}
    />
  )
}
