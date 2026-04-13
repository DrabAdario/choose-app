import { useCallback, useEffect, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getOrCreateParticipantId } from '../lib/participantStorage'
import { mergeParticipantName } from '../lib/participantNames'
import { appendActivity } from '../lib/sessionActivity'
import {
  emptyWheel,
  parseWheelState,
  type WheelState,
} from '../lib/wheelTypes'
import { applyWheelUndo } from '../lib/undoWheelActivity'
import { isValidSessionUuid } from '../lib/uuid'

export type WheelSessionMode = 'loading' | 'remote' | 'local'

function initialMode(sessionId: string | undefined): WheelSessionMode {
  if (!sessionId) return 'local'
  if (!isSupabaseConfigured || !supabase) return 'local'
  if (!isValidSessionUuid(sessionId)) return 'local'
  return 'loading'
}

function initialError(sessionId: string | undefined): string | null {
  if (!sessionId) return null
  if (!isValidSessionUuid(sessionId)) {
    return 'This session id is not a UUID. Supabase sync is off; state stays on this device only.'
  }
  return null
}

export function useWheelSession(
  sessionId: string | undefined,
  actorDisplayName: string,
): {
  mode: WheelSessionMode
  wheel: WheelState
  error: string | null
  participantId: string
  addOption: (text: string) => void
  setResult: (
    optionId: string | null,
    spinMeta?: { winnerLabel?: string },
  ) => void
  undoActivity: (eventId: string) => string | null
} {
  const participantId = sessionId
    ? getOrCreateParticipantId(sessionId)
    : ''

  const [mode, setMode] = useState<WheelSessionMode>(() =>
    initialMode(sessionId),
  )
  const [wheel, setWheel] = useState<WheelState>(emptyWheel)
  const [error, setError] = useState<string | null>(() =>
    initialError(sessionId),
  )
  const wheelRef = useRef(wheel)
  const modeRef = useRef(mode)

  useEffect(() => {
    wheelRef.current = wheel
  }, [wheel])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const persistRemote = useCallback(
    async (next: WheelState) => {
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

  useEffect(() => {
    if (!participantId || !actorDisplayName.trim()) return
    const prev = wheelRef.current
    const merged = mergeParticipantName(prev, participantId, actorDisplayName)
    if (merged === prev) return
    setWheel(merged)
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
        setWheel(parseWheelState(existing.state))
        setMode('remote')
        return
      }

      const { error: insErr } = await client.from('sessions').insert({
        id: sessionId,
        tool: 'wheel',
        state: emptyWheel(),
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
      setWheel(parseWheelState(row.state))
      setMode('remote')
    }

    void loadRow()

    const channel = client
      .channel(`wheel-sessions:${sessionId}`)
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
            setWheel(parseWheelState(row.state))
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
      const prev = wheelRef.current
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
      setWheel(next)
      if (modeRef.current === 'remote') void persistRemote(next)
    },
    [actorDisplayName, participantId, persistRemote],
  )

  const setResult = useCallback(
    (
      optionId: string | null,
      spinMeta?: { winnerLabel?: string },
    ) => {
      const prev = wheelRef.current
      let next: WheelState

      if (optionId !== null && spinMeta && actorDisplayName.trim()) {
        const actorName = actorDisplayName.trim()
        next = mergeParticipantName(prev, participantId, actorDisplayName)
        next = {
          ...next,
          resultId: optionId,
          activity: appendActivity(next.activity, {
            participantId,
            actorName,
            kind: 'spin_result',
            detail: spinMeta.winnerLabel,
            targetId: optionId,
          }),
        }
      } else {
        next = { ...prev, resultId: optionId }
      }

      setWheel(next)
      if (modeRef.current === 'remote') void persistRemote(next)
    },
    [actorDisplayName, participantId, persistRemote],
  )

  const undoActivity = useCallback(
    (eventId: string): string | null => {
      if (!actorDisplayName.trim()) return 'Set your name first.'
      const prev = wheelRef.current
      const ev = prev.activity?.find((e) => e.id === eventId)
      if (!ev) return 'Event not found.'
      const result = applyWheelUndo(prev, ev, participantId)
      if ('error' in result) return result.error
      const next = mergeParticipantName(
        result.next,
        participantId,
        actorDisplayName,
      )
      setWheel(next)
      if (modeRef.current === 'remote') void persistRemote(next)
      return null
    },
    [actorDisplayName, participantId, persistRemote],
  )

  return {
    mode,
    wheel,
    error,
    participantId,
    addOption,
    setResult,
    undoActivity,
  }
}
