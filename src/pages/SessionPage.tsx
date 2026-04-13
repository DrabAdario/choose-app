import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { ActivityLogAccordion } from '../components/ActivityLogAccordion'
import { NameRequiredDialog } from '../components/NameRequiredDialog'
import { ParticipantPresence } from '../components/ParticipantPresence'
import { useActivityToast } from '../hooks/useActivityToast'
import { usePollSession } from '../hooks/usePollSession'
import { getStoredDisplayName, setStoredDisplayName } from '../lib/displayNameStorage'
import { buildInviteUrl } from '../lib/shareUrl'
import { isSupabaseConfigured } from '../lib/supabase'

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [draft, setDraft] = useState('')
  const [displayName, setDisplayName] = useState(() =>
    sessionId ? getStoredDisplayName(sessionId) : '',
  )

  const nameReady = displayName.trim().length > 0

  const {
    mode,
    poll,
    error,
    participantId,
    addOption,
    vote,
    closePoll,
    undoActivity,
  } = usePollSession(sessionId, displayName)

  const [undoFeedback, setUndoFeedback] = useState<string | null>(null)

  const toast = useActivityToast(poll.activity)

  const shareUrl = useMemo(
    () =>
      sessionId ? buildInviteUrl('session', sessionId) : '',
    [sessionId],
  )

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
  const disabled = loading || poll.closed || !nameReady

  function onAddOption() {
    addOption(draft)
    setDraft('')
  }

  function handleSaveName(name: string) {
    if (!sessionId) return
    setStoredDisplayName(sessionId, name)
    setDisplayName(name)
  }

  if (!sessionId) {
    return (
      <Typography>
        Missing session. <RouterLink to="/">Home</RouterLink>
      </Typography>
    )
  }

  return (
    <>
      <NameRequiredDialog
        open={!nameReady}
        initialName={getStoredDisplayName(sessionId)}
        onSave={handleSaveName}
      />

      <Stack spacing={3}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Session
          </Typography>
          <Typography variant="h4" component="h1" gutterBottom>
            Poll
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ wordBreak: 'break-all', display: 'block' }}
          >
            {sessionId}
          </Typography>
          <Button
            size="small"
            variant="text"
            onClick={() => void navigator.clipboard.writeText(shareUrl)}
            sx={{ mt: 1 }}
          >
            Copy invite link
          </Button>
        </Box>

        <ParticipantPresence names={poll.names} />

        <ActivityLogAccordion
          activity={poll.activity}
          participantId={participantId}
          tool="poll"
          onUndo={(eventId) => {
            const err = undoActivity(eventId)
            if (err) setUndoFeedback(err)
          }}
        />

        {error && <Alert severity="warning">{error}</Alert>}

        {mode === 'remote' && (
          <Alert severity="success" variant="outlined">
            Live — changes sync across devices.
          </Alert>
        )}

        {!isSupabaseConfigured && (
          <Alert severity="warning">
            Live sync is off: this build has no Supabase URL/key. Each device
            keeps its own copy — invites will not match. For local dev, add{' '}
            <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>{' '}
            to <code>.env</code>. For GitHub Pages, add the same two as{' '}
            <strong>repository secrets</strong> so CI can inject them at build
            time (see README).
          </Alert>
        )}

        {loading && (
          <Typography color="text.secondary">Loading session…</Typography>
        )}

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Options
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ mb: 2 }}
            >
              <TextField
                fullWidth
                size="small"
                label="Add an option"
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
              <Button variant="outlined" disabled={disabled} onClick={onAddOption}>
                Add
              </Button>
            </Stack>

            <Stack spacing={1}>
              {poll.options.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No options yet — add a few above.
                </Typography>
              )}
              {poll.options.map((o) => {
                const selected = poll.votes[participantId] === o.id
                return (
                  <Button
                    key={o.id}
                    fullWidth
                    variant={selected ? 'contained' : 'outlined'}
                    color={selected ? 'primary' : 'inherit'}
                    onClick={() => vote(o.id)}
                    disabled={disabled}
                    sx={{ justifyContent: 'space-between', textTransform: 'none' }}
                  >
                    <span>{o.text}</span>
                    <Chip
                      size="small"
                      label={counts[o.id] ?? 0}
                      sx={{ fontWeight: 600 }}
                    />
                  </Button>
                )
              })}
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                alignItems: { sm: 'center' },
                justifyContent: 'space-between',
                mt: 2,
              }}
            >
              <Button
                variant="contained"
                disabled={disabled || poll.options.length === 0}
                onClick={closePoll}
              >
                Close voting
              </Button>
              {poll.closed && winner && (
                <Typography color="text.secondary">
                  Result: <strong>{winner.text}</strong>
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Typography variant="caption" color="text.secondary">
          Participant id:{' '}
          <Box component="span" sx={{ fontFamily: 'monospace' }}>
            {participantId}
          </Box>
        </Typography>
      </Stack>

      <Snackbar
        open={toast.open}
        message={toast.message}
        onClose={toast.close}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      <Snackbar
        open={undoFeedback !== null}
        message={undoFeedback ?? ''}
        onClose={() => setUndoFeedback(null)}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}
