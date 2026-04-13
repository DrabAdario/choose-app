import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export function JoinPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [tool, setTool] = useState<'poll' | 'wheel'>('poll')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    const path = tool === 'poll' ? `/session/${trimmed}` : `/wheel/${trimmed}`
    navigate(path)
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 480, mx: 'auto' }}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Join a session
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Paste the session id from your invite link, choose which tool you are
          joining, then continue.
        </Typography>
      </Box>

      <Card variant="outlined" component="form" onSubmit={onSubmit}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Session id"
              name="code"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <FormControl>
              <FormLabel id="tool-label">Tool</FormLabel>
              <RadioGroup
                row
                aria-labelledby="tool-label"
                name="tool"
                value={tool}
                onChange={(_, v) => setTool(v as 'poll' | 'wheel')}
              >
                <FormControlLabel
                  value="poll"
                  control={<Radio />}
                  label="Poll"
                />
                <FormControlLabel
                  value="wheel"
                  control={<Radio />}
                  label="Wheel"
                />
              </RadioGroup>
            </FormControl>

            <Alert severity="info" variant="outlined">
              Session links look like <code>#/session/…</code> or{' '}
              <code>#/wheel/…</code> — pick the matching tool.
            </Alert>

            <Button type="submit" variant="contained" size="large" fullWidth>
              Join
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
