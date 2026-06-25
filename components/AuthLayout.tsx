import Link from 'next/link'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f9]">
      <header className="flex h-14 items-center border-b border-[#d6deea] bg-white px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 bg-[#0062ff] [clip-path:polygon(24%_0,100%_0,100%_100%,0_100%)]" />
          <span className="text-[17px] font-semibold tracking-tight text-[#0f1b2d]">Prokuro.ai</span>
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-12">{children}</div>
    </div>
  )
}
