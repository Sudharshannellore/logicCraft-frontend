import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface PixelBarProps {
  percent: number
  segments?: number
  color?: 'accent' | 'violet' | 'error' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const fill = {
  accent: 'bg-[var(--color-accent)]',
  violet: 'bg-[var(--color-violet)]',
  error: 'bg-[var(--color-error)]',
  warning: 'bg-[var(--color-warning)]',
  info: 'bg-[var(--color-info)]',
}

const heights = { sm: 'h-2', md: 'h-3', lg: 'h-5' }

/** Segmented "HP bar" progress: blocks light up one by one. */
export function PixelBar({ percent, segments = 20, color = 'accent', size = 'md', className, label }: PixelBarProps) {
  const reduceMotion = useReducedMotion()
  const clamped = Math.min(100, Math.max(0, percent))
  const lit = Math.round((clamped / 100) * segments)

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('flex gap-[2px] bg-[var(--pixel-ink)] p-[2px] shadow-[0_0_0_2px_var(--color-border-strong)]', className)}
    >
      {Array.from({ length: segments }, (_, i) => {
        const on = i < lit
        return (
          <motion.span
            key={i}
            className={cn(
              'flex-1',
              heights[size],
              on ? fill[color] : 'bg-[var(--color-surface-elevated)]',
              on && i === lit - 1 && 'brightness-125',
            )}
            style={on ? { boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.25)' } : undefined}
            initial={reduceMotion || !on ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.025, duration: 0.01 }}
          />
        )
      })}
    </div>
  )
}
