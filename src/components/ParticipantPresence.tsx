import { Avatar, Box, Chip, Stack, Typography } from '@mui/material'

type ParticipantPresenceProps = {
  names: Record<string, string> | undefined
}

export function ParticipantPresence({ names }: ParticipantPresenceProps) {
  const entries = Object.entries(names ?? {}).filter(([, n]) => n.trim().length > 0)

  if (entries.length === 0) {
    return null
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
        In this session
      </Typography>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ flexWrap: 'wrap', gap: 0.75 }}
      >
        {entries.map(([id, label]) => (
          <Chip
            key={id}
            size="small"
            avatar={<Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{label.charAt(0).toUpperCase()}</Avatar>}
            label={label}
            variant="outlined"
          />
        ))}
      </Stack>
    </Box>
  )
}
