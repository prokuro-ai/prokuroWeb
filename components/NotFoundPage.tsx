import { ArrowLeft, CalendarDays, LayoutDashboard } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import { Link } from '@/lib/navigation'
import { BOOK_DEMO_LABEL, SCHEDULE_DEMO_PATH } from '@/lib/sales'
import styles from './not-found.module.css'

const QUICK_LINKS = [
  {
    href: '/',
    label: 'Home',
    hint: 'Product overview, how it works, and pilot details.',
    icon: ArrowLeft,
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    hint: 'Your BOMs, risk scores, and decision cards.',
    icon: LayoutDashboard,
  },
  {
    href: SCHEDULE_DEMO_PATH,
    label: BOOK_DEMO_LABEL,
    hint: 'Thirty minutes with the team on a real BOM.',
    icon: CalendarDays,
  },
] as const

export default function NotFoundPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>
        <div className={styles.glow} aria-hidden="true" />
        <div className="container">
          <div className={styles.content}>
            <p className="eyebrow">Page not found</p>
            <p className={styles.code} aria-hidden="true">
              404
            </p>
            <h1 className={styles.title}>This route isn&apos;t on the map</h1>
            <p className={styles.copy}>
              The URL you followed didn&apos;t resolve to anything in our system. Check the link for
              typos, or pick a known-good destination below.
            </p>

            <div className={styles.actions}>
              <Link className="btn btn--primary" href="/">
                Back to home
              </Link>
              <Link className="btn btn--ghost" href="/dashboard">
                Go to dashboard
              </Link>
            </div>
          </div>

          <ul className={styles.links} aria-label="Helpful links">
            {QUICK_LINKS.map(({ href, label, hint, icon: Icon }) => (
              <li key={href}>
                <Link className={styles.linkCard} href={href}>
                  <span className={styles.linkIcon} aria-hidden="true">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <p className={styles.linkLabel}>{label}</p>
                  <p className={styles.linkHint}>{hint}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </MarketingShell>
  )
}
