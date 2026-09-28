import PageHeader from '@/components/app/PageHeader'
import ThisWeekView from '@/components/dashboard/ThisWeekView'
import type { AnalyzedLine, BoardTally, FlaggedLineItem, FlaggedLines, LineTally } from '@/lib/types'

function tally(mix: Partial<LineTally['mix']>, situation: Partial<LineTally['situation']> = {}): LineTally {
  return {
    mix: { red: 0, yellow: 0, green: 0, noMatch: 0, pending: 0, ...mix },
    situation: {
      outOfStock: 0,
      longLead: 0,
      nrnd: 0,
      discontinued: 0,
      noAlternate: 0,
      duty: 0,
      entityList: 0,
      ...situation,
    },
    lead: { upTo4Weeks: 82, upTo12Weeks: 40, upTo26Weeks: 11, upTo52Weeks: 8, over52Weeks: 4, unpublished: 3 },
  }
}

function board(bomId: string, bomName: string, t: LineTally): BoardTally {
  return { bomId, bomName, ...t }
}

function line(row_index: number, mpn: string, risk_level: AnalyzedLine['risk_level'], extra: Partial<AnalyzedLine> = {}): AnalyzedLine {
  return {
    row_index,
    mpn,
    manufacturer: 'Acme',
    quantity: 1,
    refdes: 'U1',
    description: null,
    aml_candidates: [],
    availability_status: 'instock',
    lifecycle_status: 'active',
    match_status: 'exact',
    factory_lead_days: 14,
    total_avail: 100,
    risk_level,
    ...extra,
  }
}

function item(bomId: string, bomName: string, analyzed: AnalyzedLine): FlaggedLineItem {
  return { bomId, bomName, bomVersion: 1, line: analyzed }
}

const feed: FlaggedLines = {
  accountId: 'account-a',
  total: 15,
  account: tally(
    { red: 4, yellow: 11, green: 140, pending: 5 },
    { outOfStock: 4, discontinued: 2, noAlternate: 31, longLead: 12 },
  ),
  boards: [
    board('bom-hot', 'Controller rev C', tally({ red: 4, yellow: 6, green: 5, pending: 5 }, { outOfStock: 4, longLead: 6 })),
    board('bom-quiet', 'Power distribution', tally({ yellow: 5, green: 95 }, { noAlternate: 20 })),
    board('bom-clear', 'Front panel', tally({ green: 40 })),
    board('bom-long', 'Sensor carrier with a long board name', tally({ red: 1, yellow: 2, green: 30 }, { nrnd: 2, duty: 4 })),
  ],
  items: [
    item('bom-hot', 'Controller rev C', line(3, 'LM7805CT', 'red', { lifecycle_status: 'eol' })),
    item('bom-quiet', 'Power distribution', line(7, 'STM32F103C8T6', 'yellow', { availability_status: 'outofstock' })),
  ],
}

export default function PreviewWeekPage() {
  return (
    <div data-surface="light" className="flex min-h-dvh bg-mk-canvas font-mk-sans text-mk-ink">
      <aside className="hidden w-56 shrink-0 bg-mk-raised mk:block xl:w-60" />
      <div className="min-w-0 flex-1">
        <PageHeader title="What to do this week" serif description="4 BOMs · 160 parts · 5 still looking up" />
        <div className="mk-container max-w-[1180px] pt-4 pb-8 mk:pt-5 mk:pb-12">
          <ThisWeekView feed={feed} />
        </div>
      </div>
    </div>
  )
}
