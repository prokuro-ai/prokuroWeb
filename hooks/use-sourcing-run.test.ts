import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSourcingRun, SourcingRunError, startSourcingRun } from '@/lib/api'
import { POLL_MS, useSourcingRun } from '@/hooks/use-sourcing-run'
import type { SourcingRun } from '@/lib/types'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return { ...actual, startSourcingRun: vi.fn(), getSourcingRun: vi.fn() }
})

const start = vi.mocked(startSourcingRun)
const get = vi.mocked(getSourcingRun)

const request = { lines: [{ mpn: 'LM7805CT', quantity: 10 }] }

function running(id = 'run-1', done = 0): SourcingRun {
  return { id, status: 'running', progress: { stage: 'pricing', done, total: 1 } }
}

function finished(id = 'run-1'): SourcingRun {
  return {
    id,
    status: 'done',
    progress: { stage: 'finishing', done: 1, total: 1 },
    plan: {
      currency: 'USD',
      total: 5,
      saved: 0,
      counts: { ready: 1, short: 0, out_of_stock: 0, no_price: 0, not_found: 0, ambiguous: 0, unchecked: 0, invalid: 0, swaps: 0 },
      sources_checked: 1,
      lines: [{ mpn: 'LM7805CT', requested: 10, status: 'ready', notes: [] }],
    },
  }
}

async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  start.mockReset()
  get.mockReset()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useSourcingRun', () => {
  it('starts, polls through progress, and lands on the plan', async () => {
    start.mockResolvedValue(running())
    get.mockResolvedValueOnce(running('run-1', 0)).mockResolvedValueOnce(finished())
    const { result } = renderHook(() => useSourcingRun())

    let outcome: string | null = null
    await act(async () => {
      outcome = await result.current.start(request)
    })
    expect(outcome).toBe('running')
    expect(result.current.phase).toMatchObject({ kind: 'running', runId: 'run-1' })

    await flush(POLL_MS)
    expect(result.current.phase.kind).toBe('done')
    expect(get).toHaveBeenCalledTimes(2)
    expect(get).toHaveBeenCalledWith('run-1')
  })

  it('follows the run already going when the gateway answers 409', async () => {
    start.mockRejectedValue(new SourcingRunError('A sourcing run is already going.', 409, 'run-older'))
    get.mockResolvedValueOnce(running('run-older')).mockResolvedValue(finished('run-older'))
    const { result } = renderHook(() => useSourcingRun())
    await act(async () => {
      await result.current.start(request)
    })
    expect(result.current.phase).toMatchObject({ kind: 'running', runId: 'run-older', adopted: true })
    await flush(POLL_MS)
    expect(get).toHaveBeenCalledWith('run-older')
    expect(result.current.phase.kind).toBe('done')
  })

  it('reports a gateway without sourcing runs so the page can fall back', async () => {
    start.mockRejectedValue(new SourcingRunError('Not found', 404))
    const { result } = renderHook(() => useSourcingRun())
    let outcome: string | null = null
    await act(async () => {
      outcome = await result.current.start(request)
    })
    expect(outcome).toBe('unsupported')
    expect(result.current.phase.kind).toBe('unsupported')
  })

  it('shows the billing message when the account cannot run sourcing', async () => {
    start.mockRejectedValue(
      new SourcingRunError('This account is not enabled yet. We will reach out after we review your registration.', 403),
    )
    const { result } = renderHook(() => useSourcingRun())
    await act(async () => {
      await result.current.start(request)
    })
    expect(result.current.phase).toEqual({
      kind: 'refused',
      message: 'This account is not enabled yet. We will reach out after we review your registration.',
    })
  })

  it('treats a plain network failure on start as refused with a readable message', async () => {
    start.mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = renderHook(() => useSourcingRun())
    await act(async () => {
      await result.current.start(request)
    })
    expect(result.current.phase).toEqual({ kind: 'refused', message: 'Failed to fetch' })
  })

  it('marks a run the gateway forgot as expired', async () => {
    start.mockResolvedValue(running())
    get.mockRejectedValue(new SourcingRunError('This sourcing run has expired.', 404))
    const { result } = renderHook(() => useSourcingRun())
    await act(async () => {
      await result.current.start(request)
    })
    await flush()
    expect(result.current.phase.kind).toBe('expired')
  })

  it('rides out a few failed polls with backoff, then recovers', async () => {
    start.mockResolvedValue(running())
    get
      .mockRejectedValueOnce(new SourcingRunError('Sourcing is unavailable right now.', 502))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(finished())
    const { result } = renderHook(() => useSourcingRun())
    await act(async () => {
      await result.current.start(request)
    })
    await flush()
    expect(get).toHaveBeenCalledTimes(1)
    await flush(POLL_MS * 2)
    expect(get).toHaveBeenCalledTimes(2)
    await flush(POLL_MS * 4)
    expect(get).toHaveBeenCalledTimes(3)
    expect(result.current.phase.kind).toBe('done')
  })

  it('goes offline after repeated failures and can pick the run back up', async () => {
    start.mockResolvedValue(running())
    get.mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = renderHook(() => useSourcingRun())
    await act(async () => {
      await result.current.start(request)
    })
    await flush(60_000)
    expect(result.current.phase).toMatchObject({ kind: 'offline', runId: 'run-1' })
    expect(get).toHaveBeenCalledTimes(5)

    get.mockReset()
    get.mockResolvedValue(finished())
    act(() => result.current.resume('run-1'))
    await flush()
    expect(result.current.phase.kind).toBe('done')
  })

  it('surfaces a failed run with its message', async () => {
    start.mockResolvedValue(running())
    get.mockResolvedValue({ ...running(), status: 'failed', message: 'No distributor answered.' })
    const { result } = renderHook(() => useSourcingRun())
    await act(async () => {
      await result.current.start(request)
    })
    await flush()
    expect(result.current.phase).toEqual({ kind: 'failed', message: 'No distributor answered.' })
  })

  it('fails a done run whose plan is missing instead of rendering nothing', async () => {
    start.mockResolvedValue(running())
    get.mockResolvedValue({ ...running(), status: 'done' })
    const { result } = renderHook(() => useSourcingRun())
    await act(async () => {
      await result.current.start(request)
    })
    await flush()
    expect(result.current.phase.kind).toBe('failed')
  })

  it('gives up on a run that never finishes', async () => {
    start.mockResolvedValue(running())
    get.mockResolvedValue(running())
    const { result } = renderHook(() => useSourcingRun())
    await act(async () => {
      await result.current.start(request)
    })
    await flush(5 * 60_000)
    expect(result.current.phase.kind).toBe('failed')
    const calls = get.mock.calls.length
    await flush(60_000)
    expect(get.mock.calls.length).toBe(calls)
  })

  it('stops polling on unmount', async () => {
    start.mockResolvedValue(running())
    get.mockResolvedValue(running())
    const { result, unmount } = renderHook(() => useSourcingRun())
    await act(async () => {
      await result.current.start(request)
    })
    await flush()
    unmount()
    const calls = get.mock.calls.length
    await flush(POLL_MS * 10)
    expect(get.mock.calls.length).toBe(calls)
  })

  it('ignores a slow start that was superseded by reset', async () => {
    let resolveStart: (run: SourcingRun) => void = () => {}
    start.mockReturnValue(new Promise((resolve) => (resolveStart = resolve)))
    const { result } = renderHook(() => useSourcingRun())
    let pending: Promise<unknown> = Promise.resolve()
    act(() => {
      pending = result.current.start(request)
    })
    act(() => result.current.reset())
    await act(async () => {
      resolveStart(running())
      await pending
    })
    await flush(POLL_MS * 3)
    expect(get).not.toHaveBeenCalled()
    expect(result.current.phase.kind).toBe('idle')
  })

  it('a second start replaces the first poll loop instead of running two', async () => {
    start.mockResolvedValueOnce(running('run-a')).mockResolvedValueOnce(running('run-b'))
    get.mockImplementation(async (id) => running(id))
    const { result } = renderHook(() => useSourcingRun())
    await act(async () => {
      await result.current.start(request)
    })
    await act(async () => {
      await result.current.start(request)
    })
    get.mockClear()
    await flush(POLL_MS * 4)
    expect(new Set(get.mock.calls.map(([id]) => id))).toEqual(new Set(['run-b']))
  })
})
