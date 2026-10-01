import AccountCard from '@/components/dashboard/AccountCard'
import BoardMatrix from '@/components/dashboard/BoardMatrix'
import CallsTable from '@/components/dashboard/CallsTable'
import type { FlaggedLines } from '@/lib/types'

export default function ThisWeekView({ feed }: { feed: FlaggedLines }) {
  const { account, boards } = feed

  return (
    <div className="space-y-4 sm:space-y-5 mk:space-y-6">
      <AccountCard account={account} />
      <BoardMatrix boards={boards} />
      <CallsTable
        items={feed.items}
        total={feed.total}
        pending={account.mix.pending}
        noMatch={account.mix.noMatch}
      />
    </div>
  )
}
