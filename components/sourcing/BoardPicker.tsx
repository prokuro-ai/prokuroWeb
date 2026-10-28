'use client'

import AppPicker, { type AppPickerOption } from '@/components/app/AppPicker'

export type BoardOption = AppPickerOption

export default function BoardPicker({
  value,
  options,
  onChange,
}: {
  value: string
  options: BoardOption[]
  onChange: (value: string) => void
}) {
  return <AppPicker label="Board" value={value} options={options} onChange={onChange} className="sm:w-60" />
}
