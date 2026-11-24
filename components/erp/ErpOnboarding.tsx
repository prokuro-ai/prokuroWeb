'use client'

import { useState } from 'react'
import { appGhostBtn, appPrimaryBtn, appTextBtn } from '@/components/app/chrome'
import ErpExportHowto from '@/components/erp/ErpExportHowto'
import { ERP_PRESETS, type ErpId } from '@/lib/erp'
import { patchErpPrefs } from '@/lib/api'

type Step = 'choose' | 'export'

export default function ErpOnboarding({
  accountId,
  canWrite,
  canManage,
  onSkip,
  onReadyToUpload,
}: {
  accountId: string
  canWrite: boolean
  canManage: boolean
  onSkip: () => void
  onReadyToUpload: (erp: ErpId) => void
}) {
  const [step, setStep] = useState<Step>('choose')
  const [selected, setSelected] = useState<ErpId | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const choose = async (erp: ErpId) => {
    if (!canManage) {
      setError('Ask an owner or admin to set the default ERP.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await patchErpPrefs(accountId, { default_erp: erp })
      setSelected(erp)
      setStep('export')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your ERP choice')
    } finally {
      setBusy(false)
    }
  }

  const skip = async () => {
    if (!canManage) {
      onSkip()
      return
    }
    setBusy(true)
    setError(null)
    try {
      await patchErpPrefs(accountId, { onboarding_skipped: true })
      onSkip()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not skip onboarding')
    } finally {
      setBusy(false)
    }
  }

  if (step === 'export' && selected) {
    return (
      <div className="mx-auto max-w-xl space-y-5 py-8 text-left">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-mk-ink-subtle">
            Import from ERP
          </p>
          <h2 className="mt-2 text-[22px] font-medium tracking-tight text-mk-ink">
            Bring a BOM from {ERP_PRESETS.find((p) => p.id === selected)?.label}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-mk-ink-muted">
            Export the file from your ERP, then upload it. We map the columns for you.
          </p>
        </div>

        <ErpExportHowto erp={selected} />

        {error ? <p className="text-[13px] text-mk-red">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          {canWrite ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onReadyToUpload(selected)}
              className={appPrimaryBtn}
            >
              Upload export
            </button>
          ) : (
            <p className="text-[13px] text-mk-ink-subtle">Ask someone who can upload to add a BOM.</p>
          )}
          <button type="button" disabled={busy} onClick={() => setStep('choose')} className={appGhostBtn}>
            Change ERP
          </button>
          <button type="button" disabled={busy} onClick={() => void skip()} className={appTextBtn}>
            Skip for now
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 text-left">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-mk-ink-subtle">
          First BOM
        </p>
        <h2 className="mt-2 text-[22px] font-medium tracking-tight text-mk-ink">
          Where do your BOMs come from?
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-mk-ink-muted">
          Pick your ERP so we can recognize its export columns. You can change this later in Settings.
        </p>
      </div>

      {error ? <p className="text-[13px] text-mk-red">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {ERP_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={busy}
            onClick={() => void choose(preset.id)}
            className="rounded-[8px] bg-mk-raised px-4 py-4 text-left transition-colors hover:bg-mk-raised/80 disabled:opacity-50"
          >
            <span className="block text-[15px] font-medium text-mk-ink">{preset.label}</span>
            <span className="mt-1 block text-[12px] leading-relaxed text-mk-ink-muted">{preset.blurb}</span>
          </button>
        ))}
      </div>

      <button type="button" disabled={busy} onClick={() => void skip()} className={appTextBtn}>
        Skip for now
      </button>
    </div>
  )
}
