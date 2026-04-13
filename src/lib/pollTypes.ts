import {
  parseActivityList,
  type SessionActivityEvent,
} from './sessionActivity'

export type PollState = {
  options: { id: string; text: string }[]
  votes: Record<string, string>
  closed: boolean
  /**
   * `true` = only adding options (voting disabled). `false` = voting open, adding disabled.
   * Omitted in legacy stored state = both add and vote allowed (old behavior).
   */
  gatherPhase?: boolean
  /** participantId -> display name */
  names?: Record<string, string>
  activity?: SessionActivityEvent[]
}

/** New sessions: options-only until someone starts voting. Legacy: both allowed. */
export function pollCanAddOptions(p: PollState): boolean {
  if (p.closed) return false
  if (p.gatherPhase === undefined) return true
  return p.gatherPhase === true
}

export function pollCanVote(p: PollState): boolean {
  if (p.closed) return false
  if (p.gatherPhase === undefined) return true
  return p.gatherPhase === false
}

export function emptyPoll(): PollState {
  return {
    options: [],
    votes: {},
    closed: false,
    gatherPhase: true,
    names: {},
    activity: [],
  }
}

export function parsePollState(data: unknown): PollState {
  const e = emptyPoll()
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
  const rawVotes = d.votes
  const votes: Record<string, string> = {}
  if (rawVotes && typeof rawVotes === 'object' && !Array.isArray(rawVotes)) {
    for (const [k, v] of Object.entries(rawVotes)) {
      if (typeof k === 'string' && typeof v === 'string') votes[k] = v
    }
  }
  const closed = typeof d.closed === 'boolean' ? d.closed : false

  let gatherPhase: boolean | undefined
  if ('gatherPhase' in d && typeof d.gatherPhase === 'boolean') {
    gatherPhase = d.gatherPhase
  }

  const names: Record<string, string> = {}
  const rawNames = d.names
  if (rawNames && typeof rawNames === 'object' && !Array.isArray(rawNames)) {
    for (const [k, v] of Object.entries(rawNames)) {
      if (typeof k === 'string' && typeof v === 'string') names[k] = v
    }
  }

  const activity = parseActivityList(d.activity)

  return { options, votes, closed, gatherPhase, names, activity }
}
