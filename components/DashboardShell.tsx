'use client'

import { AuthHeaderActions } from '@/components/UserMenu'
import ProkuroBrandLink from '@/components/ProkuroBrandLink'
import { Link } from '@/lib/navigation'

type DashboardShellProps = {
  children: React.ReactNode
  /** Which primary tab should look active in the top nav */
  activeTab?: 'dashboard' | 'boms'
}

/**
 * Shared top chrome for authenticated app pages (dashboard + BOM detail).
 * Replaces the old AppLayout sidebar shell.
 */
export default function DashboardShell({ children, activeTab = 'dashboard' }: DashboardShellProps) {
  return (
    <div className="relative flex h-screen flex-col bg-surface-1 font-sans text-ink">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-canvas px-6">
        <div className="flex h-full items-center gap-8">
          <ProkuroBrandLink variant="app" />
          <nav className="flex h-full items-center">
            <ShellTab href="/dashboard?tab=dashboard" active={activeTab === 'dashboard'}>
              Dashboard
            </ShellTab>
            <ShellTab href="/dashboard?tab=boms" active={activeTab === 'boms'}>
              BOMs
            </ShellTab>
          </nav>
        </div>
        <AuthHeaderActions />
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  )
}

function ShellTab({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`relative flex h-full items-center border-b-2 px-4 text-sm font-medium transition-colors ${
        active
          ? 'border-primary text-ink'
          : 'border-transparent text-ink-muted hover:border-surface-3 hover:text-ink'
      }`}
    >
      {children}
    </Link>
  )
}
