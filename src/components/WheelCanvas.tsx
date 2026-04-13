import { Box, Typography, useTheme } from '@mui/material'

type Option = { id: string; text: string }

type WheelCanvasProps = {
  options: Option[]
  rotationDeg: number
  transitionMs?: number
  highlightOptionId?: string | null
}

function slicePath(i: number, n: number, r: number): string {
  if (n < 1) return ''
  const a0 = -Math.PI / 2 + (2 * Math.PI * i) / n
  const a1 = -Math.PI / 2 + (2 * Math.PI * (i + 1)) / n
  const x0 = r * Math.cos(a0)
  const y0 = r * Math.sin(a0)
  const x1 = r * Math.cos(a1)
  const y1 = r * Math.sin(a1)
  const largeArc = n === 2 ? 1 : 0
  return `M 0 0 L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z`
}

function labelPoint(i: number, n: number, r: number): { x: number; y: number } {
  const a = -Math.PI / 2 + (2 * Math.PI * (i + 0.5)) / n
  const lr = r * 0.62
  return { x: lr * Math.cos(a), y: lr * Math.sin(a) }
}

export function WheelCanvas({
  options,
  rotationDeg,
  transitionMs = 4200,
  highlightOptionId,
}: WheelCanvasProps) {
  const theme = useTheme()
  const palette = [
    theme.palette.primary.light,
    theme.palette.secondary.light,
    theme.palette.info?.light ?? '#7dd3fc',
    theme.palette.success?.light ?? '#86efac',
    theme.palette.warning?.light ?? '#fde047',
    theme.palette.error?.light ?? '#fca5a5',
  ]
  const n = options.length

  if (n === 0) {
    return (
      <Box
        sx={{
          width: 'min(100%, 320px)',
          aspectRatio: '1',
          mx: 'auto',
          borderRadius: '50%',
          border: '2px dashed',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ px: 2 }}
        >
          Add at least two options to spin the wheel.
        </Typography>
      </Box>
    )
  }

  const r = 100

  return (
    <Box sx={{ position: 'relative', width: 'min(100%, 360px)', mx: 'auto' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          width: 0,
          height: 0,
          borderLeft: '14px solid transparent',
          borderRight: '14px solid transparent',
          borderTop: '22px solid',
          borderTopColor: 'text.primary',
        }}
        aria-hidden
      />
      <Box
        component="svg"
        viewBox="-110 -110 220 220"
        sx={{
          width: '100%',
          height: 'auto',
          display: 'block',
          overflow: 'visible',
        }}
      >
        <g
          style={{
            transform: `rotate(${rotationDeg}deg)`,
            transformOrigin: '0px 0px',
            transition: transitionMs
              ? `transform ${transitionMs}ms cubic-bezier(0.15, 0.85, 0.2, 1)`
              : 'none',
          }}
        >
          {options.map((opt, i) => {
            const fill = palette[i % palette.length]
            const isHi =
              highlightOptionId != null && opt.id === highlightOptionId
            return (
              <path
                key={opt.id}
                d={slicePath(i, n, r)}
                fill={fill}
                stroke="rgba(255,255,255,0.92)"
                strokeWidth={isHi ? 3 : 1.5}
                opacity={isHi ? 1 : 0.98}
              />
            )
          })}
          {options.map((opt, i) => {
            const p = labelPoint(i, n, r)
            const label =
              opt.text.length > 14 ? `${opt.text.slice(0, 12)}…` : opt.text
            return (
              <text
                key={`${opt.id}-t`}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(15,23,42,0.92)"
                fontSize={n > 10 ? 10 : 12}
                fontWeight={700}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {label}
              </text>
            )
          })}
        </g>
        <circle
          cx={0}
          cy={0}
          r={r + 2}
          fill="none"
          stroke="rgba(15,23,42,0.12)"
          strokeWidth={2}
        />
      </Box>
    </Box>
  )
}
