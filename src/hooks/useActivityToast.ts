import { useEffect, useRef, useState } from 'react'
import type { SessionActivityEvent } from '../lib/sessionActivity'
import { formatActivityMessage } from '../lib/sessionActivity'

/** Shows a snackbar when a new activity event appears (skips initial history). */
export function useActivityToast(
  activity: SessionActivityEvent[] | undefined,
): {
  open: boolean
  message: string
  close: () => void
} {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const initRef = useRef(false)
  const lastIdRef = useRef<string | null>(null)

  useEffect(() => {
    const list = activity ?? []
    if (list.length === 0) return
    const last = list[list.length - 1]
    if (!initRef.current) {
      initRef.current = true
      lastIdRef.current = last.id
      return
    }
    if (lastIdRef.current === last.id) return
    lastIdRef.current = last.id
    if (last.undone) return
    queueMicrotask(() => {
      setMessage(formatActivityMessage(last))
      setOpen(true)
    })
  }, [activity])

  return {
    open,
    message,
    close: () => setOpen(false),
  }
}
