import { motion } from 'framer-motion'

const nodes = [
  { x: 40, y: 60, r: 5, color: 'var(--color-accent)' },
  { x: 140, y: 30, r: 4, color: 'var(--color-violet)' },
  { x: 230, y: 80, r: 6, color: 'var(--color-accent)' },
  { x: 300, y: 40, r: 3.5, color: 'var(--color-info)' },
  { x: 90, y: 150, r: 4, color: 'var(--color-info)' },
  { x: 200, y: 170, r: 5, color: 'var(--color-violet)' },
  { x: 320, y: 140, r: 4, color: 'var(--color-accent)' },
  { x: 20, y: 220, r: 3.5, color: 'var(--color-violet)' },
  { x: 260, y: 230, r: 5, color: 'var(--color-info)' },
]

const edges: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 4],
  [4, 5],
  [5, 2],
  [5, 6],
  [4, 7],
  [5, 8],
]

export function HeroConstellation({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 260" className={className} aria-hidden="true">
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="var(--color-border-strong)"
          strokeWidth={1}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 1, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <motion.circle
            cx={n.x}
            cy={n.y}
            r={n.r + 6}
            fill={n.color}
            opacity={0.15}
            animate={{ r: [n.r + 4, n.r + 9, n.r + 4] }}
            transition={{ duration: 2.4 + (i % 3) * 0.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={n.color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.08, type: 'spring', stiffness: 260 }}
          />
        </g>
      ))}
    </svg>
  )
}
