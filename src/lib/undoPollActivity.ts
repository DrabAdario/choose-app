import type { PollState } from './pollTypes'
import { markActivityUndone, type SessionActivityEvent } from './sessionActivity'

export function applyPollUndo(
  prev: PollState,
  event: SessionActivityEvent,
  actorId: string,
): { next: PollState } | { error: string } {
  if (event.participantId !== actorId) {
    return { error: 'Only you can undo your own actions.' }
  }
  if (event.undone) {
    return { error: 'Already undone.' }
  }

  switch (event.kind) {
    case 'add_option': {
      const tid = event.targetId
      if (!tid) return { error: 'This action is too old to undo.' }
      const opt = prev.options.find((o) => o.id === tid)
      if (!opt) return { error: 'That option is no longer there.' }
      const options = prev.options.filter((o) => o.id !== tid)
      const votes = { ...prev.votes }
      for (const [pid, oid] of Object.entries(votes)) {
        if (oid === tid) delete votes[pid]
      }
      return {
        next: {
          ...prev,
          options,
          votes,
          activity: markActivityUndone(prev.activity, event.id),
        },
      }
    }
    case 'vote': {
      const tid = event.targetId
      if (!tid) return { error: 'This action is too old to undo.' }
      if (prev.votes[actorId] !== tid) {
        return {
          error: 'Your vote changed since then — undo not applied.',
        }
      }
      const votes = { ...prev.votes }
      delete votes[actorId]
      return {
        next: {
          ...prev,
          votes,
          activity: markActivityUndone(prev.activity, event.id),
        },
      }
    }
    case 'close_poll': {
      if (!prev.closed) {
        return { error: 'The poll is already open.' }
      }
      return {
        next: {
          ...prev,
          closed: false,
          activity: markActivityUndone(prev.activity, event.id),
        },
      }
    }
    default:
      return { error: "This action can't be undone." }
  }
}
