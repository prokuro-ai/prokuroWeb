import BoardMatrix from '@/components/dashboard/BoardMatrix'
import CallsTable from '@/components/dashboard/CallsTable'
import LeadTimeChart from '@/components/dashboard/LeadTimeChart'
import PartMix from '@/components/dashboard/PartMix'
import SituationList from '@/components/dashboard/SituationList'
import { scoredTotal } from '@/lib/dashboard'
import type { FlaggedLines } from '@/lib/types'

export default function ThisWeekView({ feed }: { feed: FlaggedLines }) {
  const { account, boards } = feed
  const scored = scoredTotal(account.mix)

  return (
    <div className="space-y-5">
      <PartMix mix={account.mix} boardCount={boards.length} />
      {scored > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <SituationList situation={account.situation} scored={scored} />
          <LeadTimeChart lead={account.lead} />
        </div>
      ) : null}
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
