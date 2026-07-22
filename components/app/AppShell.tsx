'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search, UploadCloud } from 'lucide-react'
import AlertsMenu, { ProfileMenu } from '@/components/app/AppMenus'
import { PortfolioProvider, usePortfolio } from '@/components/app/PortfolioContext'
import UploadModal from '@/components/app/UploadModal'
import { btnPrimarySm, inputWithIcon, pageHeader } from '@/lib/ui/classes'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/boms', label: 'BOMs' },
] as const

interface AppShellProps {
  children: React.ReactNode
  initialUploadOpen?: boolean
}

function AppShellInner({ children, initialUploadOpen = false }: AppShellProps) {
  const pathname = usePathname()
  const { boms } = usePortfolio()
  const [uploadOpen, setUploadOpen] = useState(initialUploadOpen)
  const [bellOpen, setBellOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="relative flex h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <header className={pageHeader}>
        <div className="flex h-full items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span
              className="h-4 w-4 shrink-0 bg-[#0062ff]"
              style={{ clipPath: 'polygon(24% 0, 100% 0, 100% 100%, 0% 100%)' }}
            />
            <span className="text-[17px] font-semibold tracking-tight text-[#0f1b2d]">
              Prokuro<span className="text-[#0062ff]">.ai</span>
            </span>
          </Link>
          <nav className="flex h-full items-center">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex h-full items-center border-b-2 px-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-[#0062ff] text-[#0f1b2d]'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search parts, BOMs…"
              disabled
              title="Global search coming soon"
              className={`${inputWithIcon} w-56 text-ink-tertiary`}
            />
          </div>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className={btnPrimarySm}
          >
            <UploadCloud className="h-4 w-4" />
            Upload BOM
          </button>
          <AlertsMenu
            open={bellOpen}
            onToggle={() => {
              setBellOpen((open) => !open)
              setProfileOpen(false)
            }}
            onClose={() => setBellOpen(false)}
          />
          <ProfileMenu
            bomCount={boms.length}
            open={profileOpen}
            onToggle={() => {
              setProfileOpen((open) => !open)
              setBellOpen(false)
            }}
            onClose={() => setProfileOpen(false)}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

      <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 bg-[#0062ff]"
              style={{ clipPath: 'polygon(24% 0, 100% 0, 100% 100%, 0% 100%)' }}
            />
            <span className="text-xs font-semibold text-[#0f1b2d]">
              Prokuro<span className="text-[#0062ff]">.ai</span>
            </span>
          </div>
          <span className="text-xs text-slate-400">© 2026 Prokuro.ai. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-slate-400 transition-colors hover:text-slate-700">
            Home
          </Link>
          <a
            href="https://www.linkedin.com/company/prokuro/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 transition-colors hover:text-slate-700"
          >
            LinkedIn
          </a>
        </div>
      </footer>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}

export default function AppShell({ children, initialUploadOpen }: AppShellProps) {
  return (
    <PortfolioProvider>
      <AppShellInner initialUploadOpen={initialUploadOpen}>{children}</AppShellInner>
    </PortfolioProvider>
  )
}
