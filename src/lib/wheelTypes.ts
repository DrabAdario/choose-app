import {
  parseActivityList,
  type SessionActivityEvent,
} from './sessionActivity'

export type WheelState = {
  options: { id: string; text: string }[]
  /** Last spin result (option id). */
  resultId?: string | null
  names?: Record<string, string>
  activity?: SessionActivityEvent[]
}

export function emptyWheel(): WheelState {
  return { options: [], resultId: null, names: {}, activity: [] }
}

export function parseWheelState(data: unknown): WheelState {
  const e = emptyWheel()
  if (!data || typeof data !== 'object') return e
  const d = data as Record<string, unknown>
  const options = Array.isArray(d.options)
    ? d.options
        .map((x) => {
          if (!x || typeof x !== 'object') return null
          const o = x as Record<string, unknown>
          if (typeof o.id === 'string' && typeof o.text === 'string')
            return { id: o.id, text: o.text }
          return null
        })
        .filter((x): x is { id: string; text: string } => x !== null)
    : []
  const resultId =
    d.resultId === null || d.resultId === undefined
      ? null
      : typeof d.resultId === 'string'
        ? d.resultId
        : null

  const names: Record<string, string> = {}
  const rawNames = d.names
  if (rawNames && typeof rawNames === 'object' && !Array.isArray(rawNames)) {
    for (const [k, v] of Object.entries(rawNames)) {
      if (typeof k === 'string' && typeof v === 'string') names[k] = v
    }
  }

  const activity = parseActivityList(d.activity)

  return { options, resultId, names, activity }
}
