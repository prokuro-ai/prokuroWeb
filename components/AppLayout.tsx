'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthHeaderActions } from '@/components/UserMenu'
import ProkuroBrandLink from '@/components/ProkuroBrandLink'

interface AppLayoutProps {
  children: React.ReactNode
}

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    exact: true,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: '/bom/new',
    label: 'Upload BOM',
    exact: false,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
]

function SidebarLink({ href, label, icon, exact }: { href: string; label: string; icon: React.ReactNode; exact: boolean }) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
        isActive ? 'bg-[#eef4ff] text-[#0062ff]' : 'text-[#4f5d73] hover:bg-[#f4f6f9] hover:text-[#0f1b2d]'
      }`}
    >
      <span className={isActive ? 'text-[#0062ff]' : 'text-[#98a3b6]'}>{icon}</span>
      {label}
    </Link>
  )
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f4f6f9]">
      <header className="flex h-12 flex-shrink-0 items-center border-b border-[#d6deea] bg-white px-4">
        <ProkuroBrandLink variant="app" />
        <div className="ml-auto">
          <AuthHeaderActions />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-44 flex-shrink-0 flex-col border-r border-[#d6deea] bg-white p-2">
          <p className="mb-1 px-3 pt-1 text-[10px] font-semibold uppercase tracking-widest text-[#98a3b6]">Workspace</p>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <SidebarLink key={item.href} {...item} />
            ))}
          </nav>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
