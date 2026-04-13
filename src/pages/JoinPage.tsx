import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export function JoinPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    navigate(`/session/${trimmed}`)
  }

  return (
    <div className="stack narrow">
      <h1 className="title title-sm">Join a session</h1>
      <p className="lede">
        Paste the session id from your invite link, or type the code your host
        shared.
      </p>

      <form className="card" onSubmit={onSubmit}>
        <label className="label" htmlFor="code">
          Session id / code
        </label>
        <input
          id="code"
          name="code"
          className="input"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Join
        </button>
      </form>
    </div>
  )
}
