import type { WheelState } from './wheelTypes'
import { markActivityUndone, type SessionActivityEvent } from './sessionActivity'

export function applyWheelUndo(
  prev: WheelState,
  event: SessionActivityEvent,
  actorId: string,
): { next: WheelState } | { error: string } {
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
      let resultId = prev.resultId ?? null
      if (resultId === tid) resultId = null
      return {
        next: {
          ...prev,
          options,
          resultId,
          activity: markActivityUndone(prev.activity, event.id),
        },
      }
    }
    case 'spin_result': {
      const tid = event.targetId
      if (!tid) return { error: 'This action is too old to undo.' }
      if (prev.resultId !== tid) {
        return {
          error: 'A newer spin changed the result — undo not applied.',
        }
      }
      return {
        next: {
          ...prev,
          resultId: null,
          activity: markActivityUndone(prev.activity, event.id),
        },
      }
    }
    default:
      return { error: "This action can't be undone." }
  }
}
