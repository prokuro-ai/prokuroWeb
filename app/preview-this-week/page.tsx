'use client'

import PageHeader from '@/components/app/PageHeader'
import { appPage, appSection } from '@/components/app/chrome'
import ThisWeekView from '@/components/dashboard/ThisWeekView'
import type { AnalyzedLine, BoardTally, FlaggedLines } from '@/lib/types'

function board(
  bomId: string,
  bomName: string,
  mix: [number, number, number, number, number],
  s: [number, number, number, number, number, number, number],
): BoardTally {
  const [red, yellow, green, noMatch, pending] = mix
  const [outOfStock, longLead, nrnd, discontinued, noAlternate, duty, entityList] = s
  return {
    bomId,
    bomName,
    mix: { red, yellow, green, noMatch, pending },
    situation: { outOfStock, longLead, nrnd, discontinued, noAlternate, duty, entityList },
    lead: { upTo4Weeks: 0, upTo12Weeks: 0, upTo26Weeks: 0, upTo52Weeks: 0, over52Weeks: 0, unpublished: 0 },
  }
}

function line(row: number, mpn: string, manufacturer: string, risk: AnalyzedLine['risk_level'], extra: Partial<AnalyzedLine>): AnalyzedLine {
  return {
    row_index: row,
    mpn,
    manufacturer,
    quantity: 2,
    refdes: `U${row}`,
    description: null,
    aml_candidates: [],
    availability_status: 'InStock',
    lifecycle_status: 'Active',
    match_status: 'Exact',
    factory_lead_days: 70,
    total_avail: 12000,
    risk_level: risk,
    ...extra,
  }
}

const boards = [
  board('b1', 'Motor controller rev C', [6, 9, 71, 2, 0], [4, 5, 3, 3, 64, 12, 0]),
  board('b2', 'Sensor hub v2', [3, 4, 52, 1, 6], [2, 2, 1, 2, 48, 9, 1]),
  board('b3', 'Power stage 48V', [2, 6, 88, 0, 0], [1, 4, 2, 1, 70, 20, 0]),
  board('b4', 'Gateway main board', [1, 5, 143, 4, 0], [1, 3, 2, 1, 121, 31, 0]),
  board('b5', 'LED driver', [0, 2, 38, 0, 0], [0, 1, 1, 0, 30, 4, 0]),
  board('b6', 'Test fixture', [0, 0, 24, 1, 0], [0, 0, 0, 0, 22, 0, 0]),
]

const sum = (pick: (b: BoardTally) => number) => boards.reduce((total, b) => total + pick(b), 0)

const feed: FlaggedLines = {
  accountId: 'preview',
  total: sum((b) => b.mix.red + b.mix.yellow),
  boards,
  account: {
    mix: {
      red: sum((b) => b.mix.red),
      yellow: sum((b) => b.mix.yellow),
      green: sum((b) => b.mix.green),
      noMatch: sum((b) => b.mix.noMatch),
      pending: sum((b) => b.mix.pending),
    },
    situation: {
      outOfStock: sum((b) => b.situation.outOfStock),
      longLead: sum((b) => b.situation.longLead),
      nrnd: sum((b) => b.situation.nrnd),
      discontinued: sum((b) => b.situation.discontinued),
      noAlternate: sum((b) => b.situation.noAlternate),
      duty: sum((b) => b.situation.duty),
      entityList: sum((b) => b.situation.entityList),
    },
    lead: { upTo4Weeks: 214, upTo12Weeks: 131, upTo26Weeks: 58, upTo52Weeks: 12, over52Weeks: 3, unpublished: 34 },
  },
  items: [
    item('b1', 'Motor controller rev C', line(4, 'LM7805CT', 'Texas Instruments', 'red', { lifecycle_status: 'EOL', availability_status: 'OutOfStock', total_avail: 0 })),
    item('b1', 'Motor controller rev C', line(11, 'DRV8323RSRGZR', 'Texas Instruments', 'red', { availability_status: 'OutOfStock', total_avail: 0, factory_lead_days: 280 })),
    item('b2', 'Sensor hub v2', line(2, 'BME280', 'Bosch', 'red', { total_duty_pct: 25 })),
    item('b3', 'Power stage 48V', line(7, 'IRFB4110PBF', 'Infineon', 'red', { lifecycle_status: 'discontinued' })),
    item('b4', 'Gateway main board', line(19, 'ESP32-WROOM-32E', 'Espressif', 'red', { entity_list_match: true })),
    item('b1', 'Motor controller rev C', line(22, 'STM32F103C8T6', 'STMicroelectronics', 'yellow', { lifecycle_status: 'NRND', total_avail: 820 })),
    item('b2', 'Sensor hub v2', line(9, 'TPS62130RGTR', 'Texas Instruments', 'yellow', { factory_lead_days: 210, total_avail: 140 })),
    item('b3', 'Power stage 48V', line(14, 'GRM31CR71H475KA12L', 'Murata', 'yellow', { factory_lead_days: 196 })),
    item('b4', 'Gateway main board', line(31, 'W25Q128JVSIQ', 'Winbond', 'yellow', { total_duty_pct: 7.5 })),
    item('b5', 'LED driver', line(3, 'AL8860WT-7', 'Diodes Inc', 'yellow', { total_avail: 95 })),
  ],
}

function item(bomId: string, bomName: string, analyzed: AnalyzedLine) {
  return { bomId, bomName, bomVersion: 1, line: analyzed }
}

export default function PreviewThisWeek() {
  return (
    <div className={appPage}>
      <PageHeader title="What to do this week" description="6 BOMs · 436 parts · 6 still looking up" />
      <div className={appSection}>
        <ThisWeekView feed={feed} />
      </div>
    </div>
  )
}
