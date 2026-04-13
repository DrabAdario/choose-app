const PREFIX = 'choose.displayName.'

export function getStoredDisplayName(sessionId: string): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(PREFIX + sessionId) ?? ''
  } catch {
    return ''
  }
}

export function setStoredDisplayName(sessionId: string, name: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREFIX + sessionId, name.trim())
  } catch {
    /* ignore */
  }
}
