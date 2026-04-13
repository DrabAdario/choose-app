import { useCallback, useEffect, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getOrCreateParticipantId } from '../lib/participantStorage'
import { mergeParticipantName } from '../lib/participantNames'
import { appendActivity } from '../lib/sessionActivity'
import {
  emptyPoll,
  parsePollState,
  pollCanAddOptions,
  pollCanVote,
  type PollState,
} from '../lib/pollTypes'
import { applyPollUndo } from '../lib/undoPollActivity'
import { isValidSessionUuid } from '../lib/uuid'

export type PollSessionMode = 'loading' | 'remote' | 'local'

function initialMode(sessionId: string | undefined): PollSessionMode {
  if (!sessionId) return 'local'
  if (!isSupabaseConfigured || !supabase) return 'local'
  if (!isValidSessionUuid(sessionId)) return 'local'
  return 'loading'
}

function initialError(sessionId: string | undefined): string | null {
  if (!sessionId) return null
  if (!isValidSessionUuid(sessionId)) {
    return 'This session id is not a UUID. Supabase sync is off; votes stay on this device only.'
  }
  return null
}

export function usePollSession(
  sessionId: string | undefined,
  actorDisplayName: string,
): {
  mode: PollSessionMode
  poll: PollState
  error: string | null
  participantId: string
  addOption: (text: string) => void
  vote: (optionId: string) => void
  closePoll: () => void
  startVoting: () => void
  undoActivity: (eventId: string) => string | null
} {
  const participantId = sessionId
    ? getOrCreateParticipantId(sessionId)
    : ''

  const [mode, setMode] = useState<PollSessionMode>(() =>
    initialMode(sessionId),
  )
  const [poll, setPoll] = useState<PollState>(emptyPoll)
  const [error, setError] = useState<string | null>(() =>
    initialError(sessionId),
  )
  const pollRef = useRef(poll)
  const modeRef = useRef(mode)

  useEffect(() => {
    pollRef.current = poll
  }, [poll])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const persistRemote = useCallback(
    async (next: PollState) => {
      if (!sessionId || !supabase) return
      const { error: upErr } = await supabase
        .from('sessions')
        .update({
          state: next,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
      if (upErr) setError(upErr.message)
    },
    [sessionId],
  )

  /** Keep display name in sync when the user sets it (no activity row). */
  useEffect(() => {
    if (!participantId || !actorDisplayName.trim()) return
    const prev = pollRef.current
    const merged = mergeParticipantName(prev, participantId, actorDisplayName)
    if (merged === prev) return
    setPoll(merged)
    if (modeRef.current === 'remote') void persistRemote(merged)
  }, [actorDisplayName, participantId, persistRemote])

  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured || !supabase) return
    if (!isValidSessionUuid(sessionId)) return

    const client = supabase
    let cancelled = false

    async function loadRow() {
      const { data: existing, error: selErr } = await client
        .from('sessions')
        .select('state')
        .eq('id', sessionId)
        .maybeSingle()

      if (cancelled) return
      if (selErr) {
        setError(selErr.message)
        setMode('local')
        return
      }

      if (existing) {
        setPoll(parsePollState(existing.state))
        setMode('remote')
        return
      }

      const { error: insErr } = await client.from('sessions').insert({
        id: sessionId,
        tool: 'poll',
        state: emptyPoll(),
      })

      if (cancelled) return
      if (insErr && insErr.code !== '23505') {
        setError(insErr.message)
        setMode('local')
        return
      }

      const { data: row, error: againErr } = await client
        .from('sessions')
        .select('state')
        .eq('id', sessionId)
        .single()

      if (cancelled) return
      if (againErr) {
        setError(againErr.message)
        setMode('local')
        return
      }
      setPoll(parsePollState(row.state))
      setMode('remote')
    }

    void loadRow()

    const channel = client
      .channel(`sessions:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as { state?: unknown } | null
          if (row?.state !== undefined)
            setPoll(parsePollState(row.state))
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      void client.removeChannel(channel)
    }
  }, [sessionId])

  const addOption = useCallback(
    (text: string) => {
      if (!actorDisplayName.trim()) return
      const t = text.trim()
      if (!t) return
      const prev = pollRef.current
      if (!pollCanAddOptions(prev)) return
      const actor = actorDisplayName.trim()
      const optionId = crypto.randomUUID()
      let next = mergeParticipantName(prev, participantId, actorDisplayName)
      next = {
        ...next,
        options: [...next.options, { id: optionId, text: t }],
        activity: appendActivity(next.activity, {
          participantId,
          actorName: actor,
          kind: 'add_option',
          detail: t,
          targetId: optionId,
        }),
      }
      setPoll(next)
      if (modeRef.current === 'remote') void persistRemote(next)
    },
    [actorDisplayName, participantId, persistRemote],
  )

  const vote = useCallback(
    (optionId: string) => {
      if (!actorDisplayName.trim()) return
      const prev = pollRef.current
      if (!pollCanVote(prev)) return
      const actor = actorDisplayName.trim()
      const optLabel =
        prev.options.find((o) => o.id === optionId)?.text ?? ''
      let next = mergeParticipantName(prev, participantId, actorDisplayName)
      next = {
        ...next,
        votes: { ...next.votes, [participantId]: optionId },
        activity: appendActivity(next.activity, {
          participantId,
          actorName: actor,
          kind: 'vote',
          detail: optLabel,
          targetId: optionId,
        }),
      }
      setPoll(next)
      if (modeRef.current === 'remote') void persistRemote(next)
    },
    [actorDisplayName, participantId, persistRemote],
  )

  const startVoting = useCallback(() => {
    if (!actorDisplayName.trim()) return
    const prev = pollRef.current
    if (prev.closed || prev.gatherPhase !== true) return
    if (prev.options.length === 0) return
    const actor = actorDisplayName.trim()
    let next = mergeParticipantName(prev, participantId, actorDisplayName)
    next = {
      ...next,
      gatherPhase: false,
      activity: appendActivity(next.activity, {
        participantId,
        actorName: actor,
        kind: 'start_voting',
      }),
    }
    setPoll(next)
    if (modeRef.current === 'remote') void persistRemote(next)
  }, [actorDisplayName, participantId, persistRemote])

  const closePoll = useCallback(() => {
    if (!actorDisplayName.trim()) return
    const prev = pollRef.current
    if (prev.closed) return
    if (prev.gatherPhase === true) return
    const actor = actorDisplayName.trim()
    let next = mergeParticipantName(prev, participantId, actorDisplayName)
    next = {
      ...next,
      closed: true,
      activity: appendActivity(next.activity, {
        participantId,
        actorName: actor,
        kind: 'close_poll',
      }),
    }
    setPoll(next)
    if (modeRef.current === 'remote') void persistRemote(next)
  }, [actorDisplayName, participantId, persistRemote])

  const undoActivity = useCallback(
    (eventId: string): string | null => {
      if (!actorDisplayName.trim()) return 'Set your name first.'
      const prev = pollRef.current
      const ev = prev.activity?.find((e) => e.id === eventId)
      if (!ev) return 'Event not found.'
      const result = applyPollUndo(prev, ev, participantId)
      if ('error' in result) return result.error
      const next = mergeParticipantName(
        result.next,
        participantId,
        actorDisplayName,
      )
      setPoll(next)
      if (modeRef.current === 'remote') void persistRemote(next)
      return null
    },
    [actorDisplayName, participantId, persistRemote],
  )

  return {
    mode,
    poll,
    error,
    participantId,
    addOption,
    vote,
    closePoll,
    startVoting,
    undoActivity,
  }
}
