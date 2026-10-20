import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const COLORS = ['var(--color-accent)', 'var(--color-violet)', 'var(--color-info)', 'var(--color-warning)']

interface Particle {
  id: number
  x: number
  rotate: number
  color: string
  delay: number
  size: number
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 320,
    rotate: Math.random() * 360,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.15,
    size: 6 + Math.random() * 6,
  }))
}

export function Confetti({ fire, count = 28 }: { fire: boolean; count?: number }) {
  const particles = useMemo(() => makeParticles(count), [count])

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center overflow-visible" aria-hidden="true">
      <AnimatePresence>
        {fire &&
          particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
              animate={{ opacity: 0, x: p.x, y: 160, rotate: p.rotate }}
              transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
              className="absolute rounded-sm"
              style={{ width: p.size, height: p.size * 0.5, backgroundColor: p.color }}
            />
          ))}
      </AnimatePresence>
    </div>
  )
}
