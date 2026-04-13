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
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { ActivityLogAccordion } from '../components/ActivityLogAccordion'
import { NameRequiredDialog } from '../components/NameRequiredDialog'
import { ParticipantPresence } from '../components/ParticipantPresence'
import { WheelCanvas } from '../components/WheelCanvas'
import { useActivityToast } from '../hooks/useActivityToast'
import { useWheelSession } from '../hooks/useWheelSession'
import {
  nextCumulativeRotation,
  rotationToBringIndexToTop,
} from '../lib/wheelGeometry'
import { getStoredDisplayName, setStoredDisplayName } from '../lib/displayNameStorage'
import { isSupabaseConfigured } from '../lib/supabase'

const SPIN_MS = 4200

export function WheelPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [draft, setDraft] = useState('')
  const [displayName, setDisplayName] = useState(() =>
    sessionId ? getStoredDisplayName(sessionId) : '',
  )

  const nameReady = displayName.trim().length > 0

  const {
    mode,
    wheel,
    error,
    participantId,
    addOption,
    setResult,
    undoActivity,
  } = useWheelSession(sessionId, displayName)

  const [undoFeedback, setUndoFeedback] = useState<string | null>(null)

  const toast = useActivityToast(wheel.activity)

  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [transitionMs, setTransitionMs] = useState(0)

  const shareUrl = useMemo(() => {
    if (!sessionId) return ''
    const { origin, pathname } = window.location
    return `${origin}${pathname}#/wheel/${sessionId}`
  }, [sessionId])

  const loading = mode === 'loading'
  const canSpin =
    wheel.options.length >= 2 &&
    !spinning &&
    !loading &&
    nameReady

  /** Align wheel with a persisted result (load, remote update, or after spin). */
  useEffect(() => {
    if (spinning) return
    if (!wheel.resultId || wheel.options.length < 2) return
    const idx = wheel.options.findIndex((o) => o.id === wheel.resultId)
    if (idx < 0) return
    const target = rotationToBringIndexToTop(idx, wheel.options.length)
    queueMicrotask(() => {
      setTransitionMs(0)
      setRotation((r) => {
        const base = Math.floor(r / 360) * 360
        return base + target
      })
    })
  }, [wheel.resultId, wheel.options, spinning])

  const handleSpin = useCallback(() => {
    if (!canSpin || !nameReady) return
    const n = wheel.options.length
    const winnerIndex = Math.floor(Math.random() * n)
    setSpinning(true)
    setTransitionMs(SPIN_MS)
    setRotation((r) => nextCumulativeRotation(r, winnerIndex, n, 5))
    const winnerId = wheel.options[winnerIndex].id
    const winnerLabel = wheel.options[winnerIndex].text
    window.setTimeout(() => {
      setResult(winnerId, { winnerLabel })
      setSpinning(false)
    }, SPIN_MS)
  }, [canSpin, nameReady, wheel.options, setResult])

  const winnerLabel = useMemo(() => {
    if (!wheel.resultId) return null
    return wheel.options.find((o) => o.id === wheel.resultId)?.text ?? null
  }, [wheel.resultId, wheel.options])

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

  const disabledInputs = loading || !nameReady

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
            Decision wheel
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

        <ParticipantPresence names={wheel.names} />

        <ActivityLogAccordion
          activity={wheel.activity}
          participantId={participantId}
          tool="wheel"
          onUndo={(eventId) => {
            const err = undoActivity(eventId)
            if (err) setUndoFeedback(err)
          }}
        />

        {error && <Alert severity="warning">{error}</Alert>}

        {mode === 'remote' && (
          <Alert severity="success" variant="outlined">
            Live — options and results sync across devices.
          </Alert>
        )}

        {!isSupabaseConfigured && (
          <Alert severity="info">
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>{' '}
            to <code>.env</code> for shared sessions.
          </Alert>
        )}

        {loading && (
          <Typography color="text.secondary">Loading session…</Typography>
        )}

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Wheel
            </Typography>
            <WheelCanvas
              options={wheel.options}
              rotationDeg={rotation}
              transitionMs={transitionMs}
              highlightOptionId={wheel.resultId}
            />
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: 'center', mt: 2 }}
            >
              <Button
                variant="contained"
                size="large"
                disabled={!canSpin}
                onClick={handleSpin}
              >
                Spin
              </Button>
            </Stack>
            {winnerLabel && (
              <Typography
                variant="h6"
                align="center"
                sx={{ mt: 2 }}
                color="primary"
              >
                Result: {winnerLabel}
              </Typography>
            )}
          </CardContent>
        </Card>

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
                disabled={disabledInputs}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onAddOption()
                  }
                }}
              />
              <Button
                variant="outlined"
                disabled={disabledInputs}
                onClick={onAddOption}
              >
                Add
              </Button>
            </Stack>
            <Stack spacing={0.5}>
              {wheel.options.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Add a few choices, then spin.
                </Typography>
              )}
              {wheel.options.map((o) => (
                <Chip
                  key={o.id}
                  label={o.text}
                  variant="outlined"
                  sx={{ justifyContent: 'flex-start' }}
                />
              ))}
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
