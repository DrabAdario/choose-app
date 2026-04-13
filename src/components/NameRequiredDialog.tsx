import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'

type NameRequiredDialogProps = {
  open: boolean
  initialName?: string
  onSave: (name: string) => void
}

export function NameRequiredDialog({
  open,
  initialName = '',
  onSave,
}: NameRequiredDialogProps) {
  const [value, setValue] = useState(initialName)

  useEffect(() => {
    if (!open) return
    queueMicrotask(() => {
      setValue(initialName)
    })
  }, [open, initialName])

  function submit() {
    const n = value.trim()
    if (n.length < 1) return
    onSave(n)
  }

  return (
    <Dialog open={open} fullWidth maxWidth="xs">
      <DialogTitle>Your name</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Display name"
          placeholder="e.g. Alex"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          margin="dense"
          helperText="Others in this session will see this name."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={submit} disabled={value.trim().length < 1}>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  )
}
