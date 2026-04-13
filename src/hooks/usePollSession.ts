import { useCallback, useEffect, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getOrCreateParticipantId } from '../lib/participantStorage'
import {
  emptyPoll,
  parsePollState,
  type PollState,
} from '../lib/pollTypes'
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

export function usePollSession(sessionId: string | undefined): {
  mode: PollSessionMode
  poll: PollState
  error: string | null
  participantId: string
  addOption: (text: string) => void
  vote: (optionId: string) => void
  closePoll: () => void
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
      const t = text.trim()
      if (!t) return
      const prev = pollRef.current
      if (prev.closed) return
      const next: PollState = {
        ...prev,
        options: [...prev.options, { id: crypto.randomUUID(), text: t }],
      }
      setPoll(next)
      if (modeRef.current === 'remote') void persistRemote(next)
    },
    [persistRemote],
  )

  const vote = useCallback(
    (optionId: string) => {
      const prev = pollRef.current
      if (prev.closed) return
      const next: PollState = {
        ...prev,
        votes: { ...prev.votes, [participantId]: optionId },
      }
      setPoll(next)
      if (modeRef.current === 'remote') void persistRemote(next)
    },
    [participantId, persistRemote],
  )

  const closePoll = useCallback(() => {
    const prev = pollRef.current
    if (prev.closed) return
    const next: PollState = { ...prev, closed: true }
    setPoll(next)
    if (modeRef.current === 'remote') void persistRemote(next)
  }, [persistRemote])

  return {
    mode,
    poll,
    error,
    participantId,
    addOption,
    vote,
    closePoll,
  }
}
