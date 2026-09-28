'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import EmptyState from '@/components/app/EmptyState'
import PageHeader from '@/components/app/PageHeader'
import PageLoading from '@/components/app/PageLoading'
import { appPage, appPrimaryBtn, appSection } from '@/components/app/chrome'
import ThisWeekView from '@/components/dashboard/ThisWeekView'
import { useFlaggedLines } from '@/hooks/use-flagged-lines'
import { mixTotal } from '@/lib/dashboard'
import { plural } from '@/lib/format'
import { stillLookingUpLabel } from '@/lib/risk'
import type { FlaggedLines } from '@/lib/types'

function statusLine(feed: FlaggedLines): string {
  const { mix } = feed.account
  return [
    plural(feed.boards.length, 'BOM'),
    plural(mixTotal(mix), 'part'),
    ...(mix.pending > 0 ? [stillLookingUpLabel(mix.pending)] : []),
  ].join(' · ')
}

function OverviewView() {
  const router = useRouter()
  const { feed, loading, error } = useFlaggedLines()
  const hasBoms = (feed?.boards.length ?? 0) > 0

  return (
    <div className={appPage}>
      <PageHeader
        title="What to do this week"
        serif
        description={
          feed && hasBoms ? (
            <>
              {statusLine(feed)}
              {error ? <span className="block text-mk-amber">Could not refresh. Showing the last load.</span> : null}
            </>
          ) : undefined
        }
      />

      <div className={appSection}>
        {loading && !feed ? (
          <PageLoading />
        ) : !feed ? (
          <EmptyState
            title="Could not load this week’s calls"
            description={error ?? undefined}
            action={
              <button type="button" onClick={() => window.location.reload()} className={appPrimaryBtn}>
                Retry
              </button>
            }
          />
        ) : !hasBoms ? (
          <EmptyState
            title="No BOMs yet"
            description="Add a BOM on the BOMs page and we’ll tell you what to fix first."
            action={
              <button type="button" onClick={() => router.push('/boms')} className={appPrimaryBtn}>
                Open BOMs
              </button>
            }
          />
        ) : (
          <ThisWeekView feed={feed} />
        )}
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')

  useEffect(() => {
    if (tab === 'boms') router.replace('/boms')
    if (tab === 'purchasing') router.replace('/purchasing')
  }, [tab, router])

  if (tab === 'boms' || tab === 'purchasing') return null

  return <OverviewView />
}
