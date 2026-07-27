export function isStaticExport(): boolean {
  return process.env.STATIC_EXPORT === '1'
}

/** Repo path segment for project Pages (e.g. "/prokuroWeb"). Empty for custom domain at root. */
export function pagesBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? ''
  if (!raw || raw === '/') return ''
  return raw.startsWith('/') ? raw.replace(/\/$/, '') : `/${raw.replace(/\/$/, '')}`
}
