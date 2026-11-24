'use client'

import { erpPreset, type ErpId } from '@/lib/erp'

export default function ErpExportHowto({
  erp,
  collapsed = false,
  onToggle,
}: {
  erp: ErpId | string
  collapsed?: boolean
  onToggle?: () => void
}) {
  const preset = erpPreset(erp)

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="text-left text-[13px] font-medium text-mk-accent hover:text-mk-accent-hover"
      >
        How to export from {preset.shortLabel}
      </button>
    )
  }

  return (
    <div className="rounded-[8px] bg-mk-raised px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-mk-ink">How to export from {preset.label}</p>
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 text-[12px] text-mk-ink-subtle hover:text-mk-ink"
          >
            Hide
          </button>
        ) : null}
      </div>
      <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[13px] leading-relaxed text-mk-ink-muted">
        {preset.exportSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="mt-3 text-[12px] text-mk-ink-subtle">
        File import only. This does not sync live from {preset.shortLabel}.
      </p>
    </div>
  )
}
