'use client'

import { useEffect } from 'react'
import { formatPageTitle } from '@/lib/pageTitle'

/** Sets the tab title. Pass null to leave the current title alone. */
export function usePageTitle(page: string | null | undefined) {
  useEffect(() => {
    if (!page) return
    document.title = formatPageTitle(page)
  }, [page])
}
