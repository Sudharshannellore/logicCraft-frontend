import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/utils/cn'

const COLS = 18
const ROWS = 11
const SPARKS = ['var(--color-accent)', 'var(--color-violet)', 'var(--color-info)']

/**
 * Retro "screen wipe": a grid of blocks covering the viewport that shrink away in a
 * diagonal wave. Remount it (via `key`) on every route change to replay.
 */
export function PixelTransition({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()

  const blocks = useMemo(
    () =>
      Array.from({ length: COLS * ROWS }, (_, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const spark = (col * 7 + row * 13) % 17 === 0
        return { i, delay: (col + row) * 0.022, spark: spark ? SPARKS[(col + row) % SPARKS.length] : null }
      }),
    [],
  )

  if (reduceMotion) return null

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none fixed z-50 grid', className)}
      style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
    >
      {blocks.map((b) => (
        <motion.span
          key={b.i}
          className="flex items-center justify-center bg-[var(--color-bg)]"
          initial={{ scale: 1.02, opacity: 1 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.22, delay: b.delay, ease: [0.7, 0, 1, 1] }}
        >
          {b.spark && <span className="h-3 w-3" style={{ backgroundColor: b.spark, boxShadow: `0 0 12px ${b.spark}` }} />}
        </motion.span>
      ))}
    </div>
  )
}
