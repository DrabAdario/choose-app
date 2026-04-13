import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/supabase'

type PollState = {
  options: { id: string; text: string }[]
  votes: Record<string, string>
  closed: boolean
}

function emptyPoll(): PollState {
  return { options: [], votes: {}, closed: false }
}

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [draft, setDraft] = useState('')
  const [poll, setPoll] = useState<PollState>(() => emptyPoll())
  const [participantId] = useState(() => crypto.randomUUID())

  const shareUrl = useMemo(() => {
    const { origin, pathname } = window.location
    return `${origin}${pathname}#/session/${sessionId}`
  }, [sessionId])

  function addOption() {
    const text = draft.trim()
    if (!text || poll.closed) return
    setPoll((p) => ({
      ...p,
      options: [...p.options, { id: crypto.randomUUID(), text }],
    }))
    setDraft('')
  }

  function vote(optionId: string) {
    if (poll.closed) return
    setPoll((p) => ({
      ...p,
      votes: { ...p.votes, [participantId]: optionId },
    }))
  }

  function closePoll() {
    setPoll((p) => ({ ...p, closed: true }))
  }

  const counts = useMemo(() => {
    const tally: Record<string, number> = {}
    for (const opt of poll.options) tally[opt.id] = 0
    for (const oid of Object.values(poll.votes)) {
      tally[oid] = (tally[oid] ?? 0) + 1
    }
    return tally
  }, [poll.options, poll.votes])

  const winner = useMemo(() => {
    if (!poll.closed || poll.options.length === 0) return null
    let best = poll.options[0].id
    let n = counts[best] ?? 0
    for (const o of poll.options) {
      const c = counts[o.id] ?? 0
      if (c > n) {
        best = o.id
        n = c
      }
    }
    return poll.options.find((o) => o.id === best) ?? null
  }, [poll.closed, poll.options, counts])

  if (!sessionId) {
    return (
      <p>
        Missing session. <Link to="/">Home</Link>
      </p>
    )
  }

  return (
    <div className="stack">
      <div className="session-head">
        <p className="eyebrow">Session</p>
        <h1 className="title title-sm">Poll</h1>
        <p className="mono session-id">{sessionId}</p>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={() => void navigator.clipboard.writeText(shareUrl)}
        >
          Copy invite link
        </button>
      </div>

      {!isSupabaseConfigured && (
        <p className="banner banner-warn" role="status">
          Showing local-only state. Connect Supabase to sync votes across
          devices.
        </p>
      )}

      <div className="card">
        <h2 className="card-title">Options</h2>
        <div className="row">
          <input
            className="input"
            placeholder="Add an option"
            value={draft}
            disabled={poll.closed}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addOption()
              }
            }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            disabled={poll.closed}
            onClick={addOption}
          >
            Add
          </button>
        </div>

        <ul className="option-list">
          {poll.options.length === 0 && (
            <li className="muted">No options yet — add a few above.</li>
          )}
          {poll.options.map((o) => {
            const selected = poll.votes[participantId] === o.id
            return (
              <li key={o.id} className="option-row">
                <button
                  type="button"
                  className={`option-btn${selected ? ' option-btn-active' : ''}`}
                  disabled={poll.closed}
                  onClick={() => vote(o.id)}
                >
                  <span>{o.text}</span>
                  <span className="pill">{counts[o.id] ?? 0}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="row row-spread">
          <button
            type="button"
            className="btn btn-primary"
            disabled={poll.closed || poll.options.length === 0}
            onClick={closePoll}
          >
            Close voting
          </button>
          {poll.closed && winner && (
            <p className="winner">
              Result: <strong>{winner.text}</strong>
            </p>
          )}
        </div>
      </div>

      <p className="muted small">
        Your participant id (for debugging):{' '}
        <span className="mono">{participantId}</span>
      </p>
    </div>
  )
}
