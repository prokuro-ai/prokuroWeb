'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  Download,
  RefreshCw,
  Sparkles,
  WifiOff,
  X,
} from 'lucide-react'
import { appPrimaryBtn, appSheet, appTextBtn, appToolbarBtn } from '@/components/app/chrome'
import type { RunPhase } from '@/hooks/use-sourcing-run'
import { partKey, type CartLine } from '@/lib/cart'
import { money } from '@/lib/purchaseDisplay'
import {
  coverage,
  needsAttention,
  noteText,
  plannedSavings,
  plannedTotal,
  sortLines,
  STATUS_META,
  statusHint,
  swapText,
  type Tone,
} from '@/lib/sourcingPlan'
import type { SourcingLineStatus, SourcingPlan, SourcingPlanLine, SourcingStage } from '@/lib/types'

const STAGES: { stage: SourcingStage; label: string }[] = [
  { stage: 'pricing', label: 'Pricing every line' },
  { stage: 'second_source', label: 'Comparing sources' },
  { stage: 'alternates', label: 'Checking alternates' },
  { stage: 'finishing', label: 'Building the plan' },
]

const FIRST_PAGE = 60

const TONE_TEXT: Record<Tone, string> = {
  good: 'text-mk-green',
  warn: 'text-mk-amber',
  bad: 'text-mk-red',
  muted: 'text-mk-ink-muted',
}

const TONE_BAR: Record<Tone, string> = {
  good: 'bg-mk-green',
  warn: 'bg-mk-amber',
  bad: 'bg-mk-red',
  muted: 'bg-mk-line-strong',
}

const TONE_CHIP: Record<Tone, string> = {
  good: 'bg-mk-green/10 text-mk-green',
  warn: 'bg-mk-amber/12 text-mk-amber',
  bad: 'bg-mk-red/10 text-mk-red',
  muted: 'bg-mk-raised text-mk-ink-muted',
}

type Filter = 'all' | 'swaps' | SourcingLineStatus

function useElapsed(since: number | null): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (since == null) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [since])
  return since == null ? 0 : Math.max(0, Math.round((now - since) / 1000))
}

function ago(savedAt: number | null): string | null {
  if (savedAt == null) return null
  const minutes = Math.round((Date.now() - savedAt) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}

export default function SourcingPlanPanel({
  phase,
  plan,
  finishedAt,
  current,
  cart,
  swaps,
  lockedSwaps,
  pending,
  appliedNote,
  canRun,
  onRun,
  onResume,
  onToggleSwap,
  onApply,
  onDownload,
  onDismiss,
}: {
  phase: RunPhase
  plan: SourcingPlan | null
  finishedAt: number | null
  /** The plan still describes the cart. */
  current: boolean
  cart: CartLine[]
  swaps: ReadonlySet<string>
  /** Swaps the cart already made; they can't be undone from the plan. */
  lockedSwaps: ReadonlySet<string>
  pending: { raise: number; swap: number }
  appliedNote: string | null
  canRun: boolean
  onRun: () => void
  onResume: (runId: string) => void
  onToggleSwap: (key: string) => void
  onApply: () => void
  onDownload: () => void
  onDismiss: () => void
}) {
  const working = phase.kind === 'starting' || phase.kind === 'running'
  const runLines = phase.kind === 'running' && phase.progress ? phase.progress.total : cart.length

  return (
    <section className={appSheet} aria-labelledby="plan-heading" aria-busy={working}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mk-line px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-mk-accent/10 text-mk-accent">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="plan-heading" className="mk-app-heading text-mk-ink">
              Sourcing plan
            </h2>
            <p className="truncate text-[12px] text-mk-ink-subtle">
              {working
                ? `Working through ${runLines.toLocaleString()} ${runLines === 1 ? 'line' : 'lines'}`
                : plan
                  ? [
                      `${plan.lines.length.toLocaleString()} ${plan.lines.length === 1 ? 'line' : 'lines'}`,
                      plan.sources_checked > 1 ? `${plan.sources_checked} sources compared` : null,
                      ago(finishedAt),
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : 'Best price across sources, price breaks, and approved alternates'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {plan && !working ? (
            <button type="button" onClick={onDownload} className={appToolbarBtn}>
              <Download className="h-3.5 w-3.5" aria-hidden />
              CSV
            </button>
          ) : null}
          {!working ? (
            <button type="button" onClick={onRun} disabled={!canRun} className={appToolbarBtn}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              {plan ? 'Run again' : 'Source this cart'}
            </button>
          ) : null}
          {!working ? (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Close sourcing plan"
              className="rounded-[6px] p-1.5 text-mk-ink-subtle hover:bg-mk-raised hover:text-mk-ink"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <PhaseNotice phase={phase} canRun={canRun} onRun={onRun} onResume={onResume} />

      {working ? (
        <Progress phase={phase} cart={cart} />
      ) : plan ? (
        <PlanBody
          plan={plan}
          current={current}
          swaps={swaps}
          lockedSwaps={lockedSwaps}
          pending={pending}
          appliedNote={appliedNote}
          canRun={canRun}
          onRun={onRun}
          onToggleSwap={onToggleSwap}
          onApply={onApply}
        />
      ) : null}
    </section>
  )
}

function PhaseNotice({
  phase,
  canRun,
  onRun,
  onResume,
}: {
  phase: RunPhase
  canRun: boolean
  onRun: () => void
  onResume: (runId: string) => void
}) {
  let tone: 'bad' | 'warn' = 'warn'
  let text: string
  let action: React.ReactNode = null
  switch (phase.kind) {
    case 'failed':
      tone = 'bad'
      text = phase.message
      action = canRun ? (
        <button type="button" className={appTextBtn} onClick={onRun}>
          Run again
        </button>
      ) : null
      break
    case 'refused':
      tone = 'bad'
      text = phase.message
      break
    case 'expired':
      text = 'That sourcing run expired before its plan loaded. Run it again for a fresh plan.'
      action = canRun ? (
        <button type="button" className={appTextBtn} onClick={onRun}>
          Run again
        </button>
      ) : null
      break
    case 'offline':
      text = 'Lost the connection while sourcing. The run keeps going on our side.'
      action = (
        <button type="button" className={appTextBtn} onClick={() => onResume(phase.runId)}>
          Check again
        </button>
      )
      break
    case 'unsupported':
      text = 'Multi-source planning isn’t switched on for this workspace yet, so the cart was priced from one source.'
      break
    default:
      return null
  }
  return (
    <div
      role={tone === 'bad' ? 'alert' : 'status'}
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2.5 text-[13px] sm:px-5 ${
        tone === 'bad' ? 'border-mk-red/20 bg-mk-red/5 text-mk-red' : 'border-mk-amber/30 bg-mk-amber/10 text-mk-ink'
      }`}
    >
      {phase.kind === 'offline' ? (
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <AlertTriangle className={`h-4 w-4 shrink-0 ${tone === 'bad' ? '' : 'text-mk-amber'}`} aria-hidden />
      )}
      <span className="min-w-0 flex-1">{text}</span>
      {action}
    </div>
  )
}

function Progress({ phase, cart }: { phase: RunPhase; cart: CartLine[] }) {
  const reduce = useReducedMotion()
  const progress = phase.kind === 'running' ? phase.progress : null
  const elapsed = useElapsed(phase.kind === 'running' ? phase.startedAt : null)
  const index = Math.max(
    0,
    STAGES.findIndex((step) => step.stage === progress?.stage),
  )
  const fraction = progress && progress.total > 0 ? Math.min(1, progress.done / progress.total) : 0
  const overall = phase.kind === 'starting' ? 0.02 : (index + fraction) / STAGES.length

  return (
    <div className="px-4 py-5 sm:px-5">
      <ol className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {STAGES.map((step, i) => {
          const state = i < index ? 'done' : i === index ? 'now' : 'later'
          return (
            <li key={step.stage} className="flex items-center gap-2 text-[13px]">
              <span
                className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  state === 'done'
                    ? 'bg-mk-accent text-white'
                    : state === 'now'
                      ? 'bg-mk-accent/15 text-mk-accent'
                      : 'bg-mk-raised text-mk-ink-subtle'
                }`}
              >
                {state === 'done' ? (
                  <Check className="h-3 w-3" aria-hidden />
                ) : state === 'now' ? (
                  <>
                    {!reduce ? (
                      <motion.span
                        className="absolute inset-0 rounded-full bg-mk-accent/25"
                        animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                      />
                    ) : null}
                    <span className="h-1.5 w-1.5 rounded-full bg-mk-accent" />
                  </>
                ) : (
                  <span className="text-[10px] font-semibold">{i + 1}</span>
                )}
              </span>
              <span className={state === 'later' ? 'text-mk-ink-subtle' : 'font-medium text-mk-ink'}>{step.label}</span>
            </li>
          )
        })}
      </ol>

      <div
        className="mt-5 h-1.5 overflow-hidden rounded-full bg-mk-raised"
        role="progressbar"
        aria-label="Sourcing progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(overall * 100)}
      >
        <motion.div
          className="h-full rounded-full bg-mk-accent"
          initial={false}
          animate={{ width: `${Math.max(2, overall * 100)}%` }}
          transition={{ duration: reduce ? 0 : 0.5, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-2 flex justify-between gap-3 text-[12px] tabular-nums text-mk-ink-subtle">
        <span>
          {phase.kind === 'starting'
            ? 'Starting…'
            : progress && progress.total > 0
              ? `${STAGES[index].label}: ${progress.done.toLocaleString()} of ${progress.total.toLocaleString()}`
              : STAGES[index].label}
        </span>
        <span>{elapsed > 0 ? `${elapsed} s` : ''}</span>
      </p>
      {phase.kind === 'running' && phase.adopted ? (
        <p className="mt-2 text-[12px] text-mk-ink-muted">
          A sourcing run was already going for your account, so this picks it up. If it was for a different cart,
          run sourcing again once it finishes.
        </p>
      ) : null}

      <ul className="mt-4 space-y-2" aria-hidden>
        {(phase.kind === 'running' && phase.adopted ? [] : cart).slice(0, 6).map((line, i) => (
          <li key={line.key} className="flex items-center gap-3">
            <span className="mk-data w-40 truncate text-[12px] text-mk-ink-subtle">{line.mpn}</span>
            <span
              className={`h-2 flex-1 rounded-full bg-mk-raised ${reduce ? '' : 'animate-pulse'}`}
              style={{ animationDelay: `${i * 120}ms` }}
            />
          </li>
        ))}
        {!(phase.kind === 'running' && phase.adopted) && cart.length > 6 ? (
          <li className="text-[12px] text-mk-ink-subtle">and {(cart.length - 6).toLocaleString()} more</li>
        ) : null}
      </ul>
    </div>
  )
}

function PlanBody({
  plan,
  current,
  swaps,
  lockedSwaps,
  pending,
  appliedNote,
  canRun,
  onRun,
  onToggleSwap,
  onApply,
}: {
  plan: SourcingPlan
  current: boolean
  swaps: ReadonlySet<string>
  lockedSwaps: ReadonlySet<string>
  pending: { raise: number; swap: number }
  appliedNote: string | null
  canRun: boolean
  onRun: () => void
  onToggleSwap: (key: string) => void
  onApply: () => void
}) {
  const reduce = useReducedMotion()
  const [filter, setFilter] = useState<Filter>('all')
  const [showAll, setShowAll] = useState(false)
  const segments = useMemo(() => coverage(plan), [plan])
  const sorted = useMemo(() => sortLines(plan.lines), [plan])
  const swapCount = plan.lines.filter((line) => line.alternate).length
  const attention = needsAttention(plan)
  const total = plannedTotal(plan, swaps)
  const saved = plannedSavings(plan, swaps)
  const ready = plan.lines.filter((line) => line.status === 'ready' || (line.alternate && swaps.has(partKey(line.mpn)))).length

  const active: Filter =
    filter === 'all' || (filter === 'swaps' ? swapCount > 0 : segments.some((segment) => segment.status === filter))
      ? filter
      : 'all'
  const visible = sorted.filter((line) =>
    active === 'all' ? true : active === 'swaps' ? !!line.alternate : line.status === active,
  )
  const shown = showAll ? visible : visible.slice(0, FIRST_PAGE)

  const nothingToBuy = plan.lines.length > 0 && plan.lines.every((line) => !line.buy && !line.alternate)

  return (
    <>
      {!current ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-mk-amber/30 bg-mk-amber/10 px-4 py-2.5 text-[13px] text-mk-ink sm:px-5"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-mk-amber" aria-hidden />
          <span className="min-w-0 flex-1">The cart changed after this plan was made. Run sourcing again to match it.</span>
          {canRun ? (
            <button type="button" className={appTextBtn} onClick={onRun}>
              Run again
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-px bg-mk-line sm:grid-cols-4">
        <Tile label="Plan total" value={money(total, plan.currency)} detail={plan.currency} />
        <Tile
          label="Ready to buy"
          value={`${ready.toLocaleString()} of ${plan.lines.length.toLocaleString()}`}
          detail={ready === plan.lines.length ? 'Every line covered' : 'lines'}
          tone={ready === plan.lines.length ? 'good' : undefined}
        />
        <Tile
          label="Needs a look"
          value={attention.toLocaleString()}
          detail={attention === 0 ? 'Nothing flagged' : attention === 1 ? 'line' : 'lines'}
          tone={attention > 0 ? 'warn' : 'good'}
        />
        <Tile
          label="Saved by planning"
          value={saved >= 0.005 ? money(saved, plan.currency) : '—'}
          detail={saved >= 0.005 ? 'price breaks, sources, swaps' : 'already at the best price'}
          tone={saved >= 0.005 ? 'good' : undefined}
        />
      </div>

      <div className="border-t border-mk-line px-4 pb-3 pt-4 sm:px-5">
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {segments.map((segment, i) => (
            <motion.div
              key={segment.status}
              className={`${TONE_BAR[STATUS_META[segment.status].tone]} h-full first:rounded-l-full last:rounded-r-full`}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${segment.share * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter plan lines">
          <FilterChip on={active === 'all'} onClick={() => setFilter('all')} label="All" count={plan.lines.length} />
          {segments.map((segment) => (
            <FilterChip
              key={segment.status}
              on={active === segment.status}
              onClick={() => setFilter(segment.status)}
              label={STATUS_META[segment.status].label}
              count={segment.count}
              tone={STATUS_META[segment.status].tone}
            />
          ))}
          {swapCount > 0 ? (
            <FilterChip on={active === 'swaps'} onClick={() => setFilter('swaps')} label="Alternates" count={swapCount} />
          ) : null}
        </div>
      </div>

      {nothingToBuy ? (
        <p className="border-t border-mk-line px-4 py-6 text-center text-[13px] text-mk-ink-muted sm:px-5">
          None of these parts can be bought right now. The notes on each line say why.
        </p>
      ) : null}

      <div className="hidden grid-cols-[minmax(0,1fr)_4.5rem_6.5rem_6rem_6.5rem] gap-x-4 border-y border-mk-line bg-mk-raised/50 px-5 py-2 text-[12px] font-medium text-mk-ink-subtle sm:grid">
        <span>Part</span>
        <span className="text-right">Need</span>
        <span className="text-right">Buy</span>
        <span className="text-right">Unit</span>
        <span className="text-right">Total</span>
      </div>

      <ul className="sm:max-h-[36rem] sm:overflow-y-auto">
        {shown.map((line, i) => (
          <PlanRow
            key={partKey(line.mpn)}
            line={line}
            currency={plan.currency}
            swapped={swaps.has(partKey(line.mpn))}
            locked={lockedSwaps.has(partKey(line.mpn))}
            onToggleSwap={() => onToggleSwap(partKey(line.mpn))}
            delay={reduce || i > 12 ? 0 : i * 0.025}
          />
        ))}
        {visible.length === 0 ? (
          <li className="px-5 py-6 text-center text-[13px] text-mk-ink-subtle">No lines match this filter.</li>
        ) : null}
      </ul>
      {!showAll && visible.length > FIRST_PAGE ? (
        <div className="border-t border-mk-line px-4 py-2.5 text-center sm:px-5">
          <button type="button" className={appTextBtn} onClick={() => setShowAll(true)}>
            Show all {visible.length.toLocaleString()} lines
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mk-line bg-mk-raised/60 px-4 py-3 sm:px-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={appliedNote ?? `${pending.raise}:${pending.swap}:${current}`}
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="min-w-0 flex-1 text-[12px] text-mk-ink-muted"
            aria-live="polite"
          >
            {appliedNote ??
              (!current
                ? 'Run sourcing again before applying this plan.'
                : pending.raise + pending.swap === 0
                  ? 'Your cart already matches this plan.'
                  : applySummary(pending))}
          </motion.p>
        </AnimatePresence>
        <button
          type="button"
          onClick={onApply}
          disabled={!current || pending.raise + pending.swap === 0}
          className={appPrimaryBtn}
        >
          Apply to cart
        </button>
      </div>
    </>
  )
}

function applySummary({ raise, swap }: { raise: number; swap: number }): string {
  const parts = [
    raise > 0 ? `raises ${raise} ${raise === 1 ? 'line' : 'lines'} to the planned quantity` : null,
    swap > 0 ? `swaps in ${swap} ${swap === 1 ? 'alternate' : 'alternates'}` : null,
  ].filter(Boolean)
  const text = parts.join(' and ')
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`
}

function Tile({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: Tone }) {
  return (
    <div className="bg-mk-canvas px-4 py-3 sm:px-5">
      <p className="text-[12px] text-mk-ink-subtle">{label}</p>
      <p className={`mt-0.5 text-[18px] font-semibold tabular-nums ${tone ? TONE_TEXT[tone] : 'text-mk-ink'}`}>{value}</p>
      <p className="truncate text-[11px] text-mk-ink-subtle">{detail}</p>
    </div>
  )
}

function FilterChip({
  on,
  onClick,
  label,
  count,
  tone,
}: {
  on: boolean
  onClick: () => void
  label: string
  count: number
  tone?: Tone
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors ${
        on ? 'border-mk-ink bg-mk-ink text-mk-canvas' : 'border-mk-line bg-mk-canvas text-mk-ink hover:bg-mk-raised'
      }`}
    >
      {tone ? <span className={`h-1.5 w-1.5 rounded-full ${TONE_BAR[tone]}`} aria-hidden /> : null}
      {label}
      <span className="tabular-nums opacity-70">{count.toLocaleString()}</span>
    </button>
  )
}

function PlanRow({
  line,
  currency,
  swapped,
  locked,
  onToggleSwap,
  delay,
}: {
  line: SourcingPlanLine
  currency: string
  swapped: boolean
  locked: boolean
  onToggleSwap: () => void
  delay: number
}) {
  const meta = STATUS_META[line.status]
  const alternate = line.alternate ?? null
  const active = swapped && alternate ? alternate : null
  const buy = active ? active.buy : (line.buy ?? null)
  const listedAs =
    buy && !active && partKey(buy.mpn) !== partKey(line.mpn) && !line.notes.some((note) => note.kind === 'matched_as')
      ? buy.mpn
      : null
  const notes = active
    ? []
    : line.notes.map((note) => noteText(note, currency)).filter((note): note is NonNullable<typeof note> => !!note)
  const hint = active ? null : statusHint(line)
  const maker = [
    active ? active.manufacturer : line.manufacturer,
    active ? active.description : line.description,
    active ? active.case_label : line.case_label,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <motion.li
      initial={delay ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="border-b border-mk-line px-4 py-3 last:border-b-0 sm:px-5"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 sm:grid-cols-[minmax(0,1fr)_4.5rem_6.5rem_6rem_6.5rem] sm:items-baseline">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className={`mk-data truncate ${active ? 'text-mk-ink-subtle line-through' : 'text-mk-ink'}`}>{line.mpn}</p>
            {active ? <p className="mk-data truncate text-mk-ink">{active.mpn}</p> : null}
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                active ? TONE_CHIP.good : TONE_CHIP[meta.tone]
              }`}
            >
              {active ? 'Swapped' : meta.label}
            </span>
          </div>
          {maker ? <p className="truncate text-[12px] text-mk-ink-subtle">{maker}</p> : null}
          <p className="mt-0.5 text-[12px] tabular-nums text-mk-ink-muted sm:hidden">
            Need {line.requested.toLocaleString()}
            {buy ? ` · buy ${buy.quantity.toLocaleString()} at ${money(buy.unit_price, currency)}` : ''}
          </p>
        </div>
        <span className="hidden text-right text-[13px] tabular-nums text-mk-ink-muted sm:block">
          {line.requested.toLocaleString()}
        </span>
        <span className="hidden text-right text-[13px] tabular-nums sm:block">
          {buy ? (
            <>
              <span className={buy.quantity !== line.requested ? 'font-medium text-mk-ink' : 'text-mk-ink'}>
                {buy.quantity.toLocaleString()}
              </span>
              {buy.packaging ? (
                <span className="block truncate text-[11px] text-mk-ink-subtle">{buy.packaging}</span>
              ) : null}
            </>
          ) : (
            <span className="text-mk-ink-subtle">—</span>
          )}
        </span>
        <span className="hidden text-right text-[13px] tabular-nums text-mk-ink-muted sm:block">
          {buy ? money(buy.unit_price, currency) : '—'}
        </span>
        <span className="self-start text-right text-[13px] font-medium tabular-nums text-mk-ink sm:self-auto">
          {buy ? money(buy.total, currency) : <span className="font-normal text-mk-ink-subtle">—</span>}
        </span>
      </div>

      {notes.length > 0 || listedAs || hint ? (
        <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px]">
          {listedAs ? <li className="text-mk-ink-muted">Buys the {listedAs} listing</li> : null}
          {notes.map((note) => (
            <li key={note.text} className={TONE_TEXT[note.tone]}>
              {note.text}
            </li>
          ))}
          {hint ? <li className="text-mk-ink-muted">{hint}</li> : null}
        </ul>
      ) : null}

      {alternate ? (
        <div
          className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[8px] border px-3 py-2 ${
            active ? 'border-mk-green/25 bg-mk-green/5' : 'border-mk-accent/25 bg-mk-accent/5'
          }`}
        >
          <ArrowLeftRight className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-mk-green' : 'text-mk-accent'}`} aria-hidden />
          <p className="min-w-0 flex-1 text-[12px] text-mk-ink">
            {active
              ? `Buying ${alternate.mpn} ${alternate.approved ? 'from your AML' : 'from the line brief'} instead of ${line.mpn}.`
              : swapText(alternate, line, currency)}
            {!alternate.approved && !active && !alternate.case_label ? (
              <span className="text-mk-ink-subtle"> Not on your AML yet, so check it fits.</span>
            ) : null}
          </p>
          {locked ? (
            <span className="text-[12px] font-medium text-mk-green">In your cart</span>
          ) : (
            <button type="button" className={appTextBtn} onClick={onToggleSwap} aria-pressed={swapped}>
              {swapped ? 'Keep original' : `Use ${alternate.mpn}`}
            </button>
          )}
        </div>
      ) : null}
    </motion.li>
  )
}
