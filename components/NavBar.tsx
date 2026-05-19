import Link from 'next/link'

interface NavBarProps {
  onLogoClick?: () => void
}

export default function NavBar({ onLogoClick }: NavBarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6">
        <button onClick={onLogoClick} className="flex items-center gap-2 focus-visible:outline-none">
          <span className="h-4 w-4 bg-primary [clip-path:polygon(24%_0,100%_0,100%_100%,0_100%)]" aria-hidden="true" />
          <span className="text-[20px] font-semibold tracking-tight text-ink">Prokuro.ai</span>
        </button>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-ink-muted transition-colors hover:text-ink">
            Landing
          </Link>
          <a
            href="https://github.com/prokuro-ai/prokuroBackend"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-hairline px-3 py-1.5 text-ink-subtle transition-colors hover:border-hairline-strong hover:text-ink"
          >
            Backend Repo
          </a>
        </nav>
      </div>
    </header>
  )
}
