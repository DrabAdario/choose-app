import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import type { SessionActivityEvent } from '../lib/sessionActivity'
import { formatActivityMessageWithStatus } from '../lib/sessionActivity'

type Props = {
  activity: SessionActivityEvent[] | undefined
  participantId: string
  tool: 'poll' | 'wheel'
  onUndo: (eventId: string) => void
}

function canTryUndo(ev: SessionActivityEvent, tool: 'poll' | 'wheel'): boolean {
  if (ev.undone) return false
  if (tool === 'poll') {
    return (
      ev.kind === 'add_option' ||
      ev.kind === 'vote' ||
      ev.kind === 'start_voting' ||
      ev.kind === 'close_poll'
    )
  }
  return ev.kind === 'add_option' || ev.kind === 'spin_result'
}

export function ActivityLogAccordion({
  activity,
  participantId,
  tool,
  onUndo,
}: Props) {
  const list = activity ?? []
  const reversed = [...list].reverse()

  return (
    <Accordion variant="outlined" disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Activity ({list.length})
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {list.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No actions yet.
          </Typography>
        ) : (
          <List dense disablePadding>
            {reversed.map((ev) => {
              const mine = ev.participantId === participantId
              const showUndo = mine && canTryUndo(ev, tool)
              const label = formatActivityMessageWithStatus(ev)
              return (
                <ListItem
                  key={ev.id}
                  disableGutters
                  sx={{
                    display: 'block',
                    py: 0.75,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-of-type': { borderBottom: 0 },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <ListItemText
                      primary={label}
                      slotProps={{
                        primary: {
                          variant: 'body2',
                          sx: ev.undone
                            ? {
                                color: 'text.secondary',
                                textDecoration: 'line-through',
                              }
                            : undefined,
                        },
                        secondary: { variant: 'caption' },
                      }}
                      secondary={new Date(ev.at).toLocaleString()}
                    />
                    {showUndo && (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => {
                          onUndo(ev.id)
                        }}
                      >
                        Undo
                      </Button>
                    )}
                  </Box>
                </ListItem>
              )
            })}
          </List>
        )}
      </AccordionDetails>
    </Accordion>
  )
}
