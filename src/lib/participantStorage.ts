const PREFIX = 'choose.participant.'

/** Stable random id per session so refresh keeps the same vote. */
export function getOrCreateParticipantId(sessionId: string): string {
  if (typeof window === 'undefined') return crypto.randomUUID()
  const key = PREFIX + sessionId
  try {
    let id = window.localStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      window.localStorage.setItem(key, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}
