/**
 * Full invite URL for hash routing, including Vite `base` (e.g. GitHub Pages
 * `/<repo>/`) so links work when the app is not served from `/`.
 */
export function buildInviteUrl(
  tool: 'session' | 'wheel',
  sessionId: string,
): string {
  if (typeof window === 'undefined') return ''
  const base = import.meta.env.BASE_URL
  const hashPath = `#/${tool}/${sessionId}`
  if (!base || base === '/') {
    return `${window.location.origin}/${hashPath}`
  }
  const path = base.endsWith('/') ? base.slice(0, -1) : base
  return `${window.location.origin}${path}/${hashPath}`
}
