import ProkuroBrandLink from '@/components/ProkuroBrandLink'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f9]">
      <header className="flex h-14 items-center border-b border-[#d6deea] bg-white px-6">
        <ProkuroBrandLink variant="auth" />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-12">{children}</div>
    </div>
  )
}
