import { Link, useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/supabase'

export function HubPage() {
  const navigate = useNavigate()

  function startSession() {
    const id = crypto.randomUUID()
    navigate(`/session/${id}`)
  }

  return (
    <div className="stack">
      <div className="hero-block">
        <h1 className="title">Decide together</h1>
        <p className="lede">
          Create a session, share the link or code, and use tools like polls
          so the group lands on a choice.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <p className="banner banner-warn" role="status">
          Realtime sync is not configured yet. Add{' '}
          <code className="inline-code">VITE_SUPABASE_URL</code> and{' '}
          <code className="inline-code">VITE_SUPABASE_ANON_KEY</code> to your
          env to connect a backend.
        </p>
      )}

      <div className="card">
        <h2 className="card-title">Poll</h2>
        <p className="card-desc">
          Add options, vote once per person, close when you are ready.
        </p>
        <button type="button" className="btn btn-primary" onClick={startSession}>
          Start a session
        </button>
      </div>

      <div className="card">
        <h2 className="card-title">Join a session</h2>
        <p className="card-desc">Have a code or link? Open the join screen.</p>
        <Link to="/join" className="btn btn-secondary">
          Join with code
        </Link>
      </div>
    </div>
  )
}
