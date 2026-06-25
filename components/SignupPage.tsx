'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import AuthLayout from '@/components/AuthLayout'
import { signUp } from '@/lib/auth'
import { mapAuthError } from '@/lib/auth-errors'

export default function SignupPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', company: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signUp(form)
      await refresh()
      router.push('/dashboard')
    } catch (err) {
      setError(mapAuthError(err, 'signUp'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-[24px] font-semibold text-[#0f1b2d]" style={{ letterSpacing: '-0.3px' }}>
            Start your free trial
          </h1>
          <p className="mt-2 text-[14px] text-[#7a8598]">Upload your first BOM in 60 seconds.</p>
        </div>

        <div className="rounded-xl border border-[#d6deea] bg-white p-8 shadow-sm">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
            )}

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#0f1b2d]">Full name</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Your name" required className="w-full rounded-md border border-[#d6deea] bg-white px-3 py-2 text-[14px] text-[#0f1b2d] placeholder:text-[#98a3b6] focus:border-[#0062ff] focus:outline-none focus:ring-1 focus:ring-[#0062ff]" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#0f1b2d]">Work email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" required className="w-full rounded-md border border-[#d6deea] bg-white px-3 py-2 text-[14px] text-[#0f1b2d] placeholder:text-[#98a3b6] focus:border-[#0062ff] focus:outline-none focus:ring-1 focus:ring-[#0062ff]" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#0f1b2d]">Company</label>
              <input type="text" value={form.company} onChange={set('company')} placeholder="Acme Hardware Inc." required className="w-full rounded-md border border-[#d6deea] bg-white px-3 py-2 text-[14px] text-[#0f1b2d] placeholder:text-[#98a3b6] focus:border-[#0062ff] focus:outline-none focus:ring-1 focus:ring-[#0062ff]" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#0f1b2d]">Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" required minLength={8} className="w-full rounded-md border border-[#d6deea] bg-white px-3 py-2 text-[14px] text-[#0f1b2d] placeholder:text-[#98a3b6] focus:border-[#0062ff] focus:outline-none focus:ring-1 focus:ring-[#0062ff]" />
            </div>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 bg-[#0062ff] px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#0050e6] disabled:opacity-60">
              {loading ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              Create account
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-[#98a3b6]">
            By creating an account you agree to our <a href="#" className="underline hover:text-[#4f5d73]">Terms of Service</a> and <a href="#" className="underline hover:text-[#4f5d73]">Privacy Policy</a>.
          </p>
        </div>

        <p className="mt-8 text-center text-[13px] text-[#7a8598]">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#0062ff] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
