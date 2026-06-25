interface UserAvatarProps {
  initials: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showEdit?: boolean
}

const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-9 w-9 text-[11px]',
  lg: 'h-16 w-16 text-[20px]',
} as const

export default function UserAvatar({ initials, size = 'sm', showEdit = false }: UserAvatarProps) {
  const avatar = (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-[#0062ff] font-semibold text-white ${SIZE_CLASSES[size]}`}
    >
      {initials}
    </div>
  )

  if (!showEdit) return avatar

  return (
    <div className="relative">
      {avatar}
      <button
        type="button"
        disabled
        title="Photo upload coming soon"
        className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-not-allowed items-center justify-center rounded-full border-2 border-white bg-[#f4f6f9] text-[#4f5d73] opacity-80 shadow-sm"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
          />
        </svg>
      </button>
    </div>
  )
}

export function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export function joinName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
}
