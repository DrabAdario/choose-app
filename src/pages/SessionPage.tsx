import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePollSession } from '../hooks/usePollSession'
import { isSupabaseConfigured } from '../lib/supabase'

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [draft, setDraft] = useState('')
  const { mode, poll, error, participantId, addOption, vote, closePoll } =
    usePollSession(sessionId)

  const shareUrl = useMemo(() => {
    if (!sessionId) return ''
    const { origin, pathname } = window.location
    return `${origin}${pathname}#/session/${sessionId}`
  }, [sessionId])

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

  const loading = mode === 'loading'
  const disabled = loading || poll.closed

  function onAddOption() {
    addOption(draft)
    setDraft('')
  }

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

      {error && (
        <p className="banner banner-warn" role="alert">
          {error}
        </p>
      )}

      {mode === 'remote' && (
        <p className="banner banner-live" role="status">
          Live — changes sync across devices.
        </p>
      )}

      {!isSupabaseConfigured && (
        <p className="banner banner-warn" role="status">
          Supabase env vars are missing. Votes stay on this device only. Add
          <code className="inline-code"> VITE_SUPABASE_URL </code> and
          <code className="inline-code"> VITE_SUPABASE_ANON_KEY </code> to
          <code className="inline-code"> .env</code>.
        </p>
      )}

      {loading && (
        <p className="muted" role="status">
          Loading session…
        </p>
      )}

      <div className="card">
        <h2 className="card-title">Options</h2>
        <div className="row">
          <input
            className="input"
            placeholder="Add an option"
            value={draft}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAddOption()
              }
            }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            disabled={disabled}
            onClick={onAddOption}
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
                  disabled={disabled}
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
            disabled={disabled || poll.options.length === 0}
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
