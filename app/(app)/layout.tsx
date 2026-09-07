import DashboardShell from '@/components/DashboardShell'
import { SettingsProvider } from '@/components/settings/SettingsContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <DashboardShell>{children}</DashboardShell>
    </SettingsProvider>
  )
}
