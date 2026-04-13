/** Merge participant display name into session state (immutable). */
export function mergeParticipantName<T extends { names?: Record<string, string> }>(
  state: T,
  participantId: string,
  actorName: string,
): T {
  const n = actorName.trim()
  if (!n) return state
  if (state.names?.[participantId] === n) return state
  return {
    ...state,
    names: { ...state.names, [participantId]: n },
  }
}
