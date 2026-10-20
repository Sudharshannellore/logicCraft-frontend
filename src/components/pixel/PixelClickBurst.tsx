import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

type Burst = { id: number; x: number; y: number }

const COLORS = ['#7bf542', '#a78bfa', '#ffd23f', '#4da3ff']
const DIRECTIONS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2
  return { dx: Math.round(Math.cos(angle) * 42), dy: Math.round(Math.sin(angle) * 42) }
})

// Clicking inside text-entry surfaces (incl. Monaco) shouldn't spray particles over the user's work.
const QUIET = 'input, textarea, select, [contenteditable="true"], .monaco-editor'

/** Every click throws off a ring of 8-bit sparks. */
export function PixelClickBurst() {
  const reduceMotion = useReducedMotion()
  const [bursts, setBursts] = useState<Burst[]>([])
  const nextId = useRef(0)

  useEffect(() => {
    if (reduceMotion) return
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element | null)?.closest?.(QUIET)) return
      const id = nextId.current++
      setBursts((b) => [...b.slice(-6), { id, x: e.clientX, y: e.clientY }])
      window.setTimeout(() => setBursts((b) => b.filter((burst) => burst.id !== id)), 600)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [reduceMotion])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]">
      <AnimatePresence>
        {bursts.map((burst) =>
          DIRECTIONS.map((d, i) => (
            <motion.span
              key={`${burst.id}-${i}`}
              className="absolute h-2 w-2"
              style={{ left: burst.x - 4, top: burst.y - 4, backgroundColor: COLORS[(burst.id + i) % COLORS.length] }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: d.dx, y: d.dy, opacity: 0, scale: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )),
        )}
      </AnimatePresence>
    </div>
  )
}
