export type ActivityKind =
  | 'add_option'
  | 'vote'
  | 'start_voting'
  | 'close_poll'
  | 'spin_result'

export type SessionActivityEvent = {
  id: string
  at: string
  participantId: string
  actorName: string
  kind: ActivityKind
  /** Human-readable detail (option label, winner, etc.). */
  detail?: string
  /** Option id or other id needed to reverse the action (e.g. vote target). */
  targetId?: string
  undone?: boolean
}

const MAX_EVENTS = 40

export function newActivityId(): string {
  return crypto.randomUUID()
}

export function appendActivity(
  existing: SessionActivityEvent[] | undefined,
  event: Omit<SessionActivityEvent, 'id' | 'at'> & { id?: string; at?: string },
): SessionActivityEvent[] {
  const row: SessionActivityEvent = {
    id: event.id ?? newActivityId(),
    at: event.at ?? new Date().toISOString(),
    participantId: event.participantId,
    actorName: event.actorName.trim() || 'Someone',
    kind: event.kind,
    detail: event.detail,
    targetId: event.targetId,
    undone: event.undone ?? false,
  }
  const prev = existing ?? []
  return [...prev, row].slice(-MAX_EVENTS)
}

const KINDS: ActivityKind[] = [
  'add_option',
  'vote',
  'start_voting',
  'close_poll',
  'spin_result',
]

export function parseActivityList(data: unknown): SessionActivityEvent[] {
  if (!Array.isArray(data)) return []
  const out: SessionActivityEvent[] = []
  for (const x of data) {
    if (!x || typeof x !== 'object') continue
    const a = x as Record<string, unknown>
    if (
      typeof a.id !== 'string' ||
      typeof a.at !== 'string' ||
      typeof a.participantId !== 'string' ||
      typeof a.actorName !== 'string' ||
      typeof a.kind !== 'string' ||
      !KINDS.includes(a.kind as ActivityKind)
    ) {
      continue
    }
    out.push({
      id: a.id,
      at: a.at,
      participantId: a.participantId,
      actorName: a.actorName,
      kind: a.kind as ActivityKind,
      detail:
        a.detail === undefined || a.detail === null
          ? undefined
          : String(a.detail),
      targetId:
        typeof a.targetId === 'string' ? a.targetId : undefined,
      undone: a.undone === true,
    })
  }
  return out
}

export function markActivityUndone(
  list: SessionActivityEvent[] | undefined,
  eventId: string,
): SessionActivityEvent[] {
  return (list ?? []).map((ev) =>
    ev.id === eventId ? { ...ev, undone: true } : ev,
  )
}

export function formatActivityMessage(e: SessionActivityEvent): string {
  const name = e.actorName.trim() || 'Someone'
  switch (e.kind) {
    case 'add_option':
      return e.detail
        ? `${name} added “${e.detail}”`
        : `${name} added an option`
    case 'vote':
      return e.detail
        ? `${name} voted on “${e.detail}”`
        : `${name} voted`
    case 'start_voting':
      return `${name} started voting`
    case 'close_poll':
      return `${name} closed voting`
    case 'spin_result':
      return e.detail
        ? `${name} spun — ${e.detail}`
        : `${name} spun the wheel`
    default:
      return `${name} updated the session`
  }
}

export function formatActivityMessageWithStatus(e: SessionActivityEvent): string {
  const base = formatActivityMessage(e)
  return e.undone ? `${base} · undone` : base
}
