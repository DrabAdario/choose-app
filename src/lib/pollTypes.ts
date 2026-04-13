export type PollState = {
  options: { id: string; text: string }[]
  votes: Record<string, string>
  closed: boolean
}

export function emptyPoll(): PollState {
  return { options: [], votes: {}, closed: false }
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
  return { options, votes, closed }
}
