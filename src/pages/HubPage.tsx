import CasinoIcon from '@mui/icons-material/Casino'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import LoginIcon from '@mui/icons-material/Login'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Stack,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/supabase'

export function HubPage() {
  const navigate = useNavigate()

  function startPoll() {
    navigate(`/session/${crypto.randomUUID()}`)
  }

  function startWheel() {
    navigate(`/wheel/${crypto.randomUUID()}`)
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Decide together
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480 }}>
          Pick a tool, share the link, and let the group converge on a choice.
        </Typography>
      </Box>

      {!isSupabaseConfigured && (
        <Alert severity="warning">
          Live sync needs Supabase: add <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code> locally, or as
          GitHub <strong>repository secrets</strong> for Pages builds (see
          README). Without them, sessions do not share across devices.
        </Alert>
      )}

      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <HowToVoteIcon color="primary" sx={{ mt: 0.25 }} aria-hidden />
              <Box>
                <Typography variant="h6" component="h2">
                  Poll
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add options, vote once per person, close when you are ready.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
            <Button variant="contained" onClick={startPoll}>
              Start poll
            </Button>
          </CardActions>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <CasinoIcon color="primary" sx={{ mt: 0.25 }} aria-hidden />
              <Box>
                <Typography variant="h6" component="h2">
                  Wheel
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  List options on a wheel and spin to pick one at random.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
            <Button variant="contained" onClick={startWheel}>
              Start wheel
            </Button>
          </CardActions>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <LoginIcon color="action" sx={{ mt: 0.25 }} aria-hidden />
              <Box>
                <Typography variant="h6" component="h2">
                  Join
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Have a session id? Open the join screen and choose poll or
                  wheel.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
            <Button variant="outlined" onClick={() => navigate('/join')}>
              Join with code
            </Button>
          </CardActions>
        </Card>
      </Stack>
    </Stack>
  )
}
