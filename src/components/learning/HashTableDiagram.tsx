import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import type { SpriteName } from '@/components/pixel/sprites'
import { cn } from '@/utils/cn'

const BUCKETS = 6
const HEIGHT = 260
const HASH_TOP = 90
const HASH_BOTTOM = 136
const BUCKET_TOP = 188

interface Entry {
  key: string
  value: number
  bucket: number
  sprite: SpriteName
}

const ENTRIES: Entry[] = [
  { key: 'apple', value: 3, bucket: 1, sprite: 'potion' },
  { key: 'banana', value: 7, bucket: 4, sprite: 'gem' },
  { key: 'cherry', value: 5, bucket: 2, sprite: 'heart' },
]

const keyX = (i: number) => ((i + 0.5) / ENTRIES.length) * 100
const bucketX = (b: number) => ((b + 0.5) / BUCKETS) * 100

/** Eases in visible 8-bit hops instead of a smooth glide. */
const steps = (n: number) => (t: number) => (t >= 1 ? 1 : Math.floor(t * n) / n)

/**
 * A pixel diagram of hashing: keys flow through hash() into numbered bucket slots.
 * One key at a time hops into its bucket on a loop (static under reduced motion).
 */
export function HashTableDiagram({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const [landed, setLanded] = useState(false)

  useEffect(() => {
    if (!landed || reduceMotion) return
    const id = window.setTimeout(() => {
      setLanded(false)
      setActive((a) => (a + 1) % ENTRIES.length)
    }, 1100)
    return () => window.clearTimeout(id)
  }, [landed, reduceMotion])

  const current = ENTRIES[active]

  return (
    <figure className={cn('border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] p-4 shadow-[3px_3px_0_var(--pixel-ink)]', className)}>
      <figcaption className="mb-3 flex items-center justify-between gap-2">
        <span className="font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">How lookup works</span>
        <span className="font-pixel text-xs text-[var(--color-accent)]">O(1) avg</span>
      </figcaption>

      <div className="relative mx-auto max-w-xl" style={{ height: HEIGHT }} role="img" aria-label="Diagram: keys apple, banana and cherry pass through a hash function that maps each one to a numbered bucket (apple to 1, banana to 4, cherry to 2).">
        {/* Dotted wiring */}
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
          {ENTRIES.map((e, i) => (
            <line
              key={`in-${e.key}`}
              x1={keyX(i)}
              y1={34}
              x2={50}
              y2={HASH_TOP}
              vectorEffect="non-scaling-stroke"
              strokeWidth={2}
              strokeDasharray="2 4"
              stroke={i === active ? 'var(--color-accent)' : 'var(--color-border-strong)'}
            />
          ))}
          {Array.from({ length: BUCKETS }, (_, b) => (
            <line
              key={`out-${b}`}
              x1={50}
              y1={HASH_BOTTOM}
              x2={bucketX(b)}
              y2={BUCKET_TOP}
              vectorEffect="non-scaling-stroke"
              strokeWidth={2}
              strokeDasharray="2 4"
              stroke={b === current.bucket ? 'var(--color-accent)' : 'var(--color-border)'}
            />
          ))}
        </svg>

        {/* Keys */}
        {ENTRIES.map((e, i) => (
          <span
            key={e.key}
            className={cn(
              'absolute top-0 -translate-x-1/2 border-2 px-2 py-1 font-pixel text-sm leading-none whitespace-nowrap',
              i === active
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]',
            )}
            style={{ left: `${keyX(i)}%` }}
          >
            "{e.key}"
          </span>
        ))}

        {/* hash() box */}
        <div
          className="pixel-frame absolute left-1/2 flex -translate-x-1/2 flex-col items-center justify-center bg-[var(--color-surface)] px-3"
          style={{ top: HASH_TOP, height: HASH_BOTTOM - HASH_TOP }}
        >
          <span className="font-pixel text-base leading-none text-[var(--color-violet)]">hash()</span>
          <span className="mt-1 font-mono text-[10px] leading-none whitespace-nowrap text-[var(--color-text-muted)]">
            hash("{current.key}") % {BUCKETS} = {current.bucket}
          </span>
        </div>

        {/* Buckets */}
        {Array.from({ length: BUCKETS }, (_, b) => {
          const entry = ENTRIES.find((e) => e.bucket === b)
          const isHit = b === current.bucket && (landed || !!reduceMotion)
          return (
            <div
              key={b}
              className={cn(
                'absolute flex -translate-x-1/2 flex-col items-center justify-center border-2 transition-colors duration-100',
                isHit
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-[0_0_0_2px_var(--pixel-ink)]'
                  : entry
                    ? 'border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)]'
                    : 'border-dashed border-[var(--color-border)] bg-transparent',
              )}
              style={{ left: `${bucketX(b)}%`, top: BUCKET_TOP, width: `calc(${100 / BUCKETS}% - 8px)`, height: HEIGHT - BUCKET_TOP }}
            >
              <span className="absolute left-1 top-0.5 font-pixel text-[10px] text-[var(--color-text-muted)]">{b}</span>
              {entry ? (
                <>
                  <PixelSprite sprite={entry.sprite} scale={2} className={cn(isHit && !reduceMotion && 'animate-pixel-bob')} />
                  <span className="font-pixel text-xs leading-none text-[var(--color-text-primary)]">{entry.value}</span>
                </>
              ) : (
                <span className="font-pixel text-xs text-[var(--color-text-muted)]">·</span>
              )}
            </div>
          )
        })}

        {/* Travelling key */}
        {!reduceMotion && !landed && (
          <motion.span
            key={active}
            aria-hidden="true"
            className="absolute z-10 border-2 border-[var(--pixel-ink)] bg-[var(--color-accent)] px-2 py-1 font-pixel text-sm leading-none whitespace-nowrap text-[#06120a] shadow-[2px_2px_0_var(--pixel-ink)]"
            style={{ x: '-50%' }}
            initial={{ left: `${keyX(active)}%`, top: 0, opacity: 0 }}
            animate={{
              left: [`${keyX(active)}%`, '50%', '50%', `${bucketX(current.bucket)}%`],
              top: [0, HASH_TOP + 10, HASH_TOP + 10, BUCKET_TOP + 18],
              opacity: [1, 1, 1, 1],
            }}
            transition={{ duration: 2.4, times: [0, 0.38, 0.6, 1], ease: steps(5), delay: 0.4 }}
            onAnimationComplete={() => setLanded(true)}
          >
            {current.key}
          </motion.span>
        )}
      </div>
    </figure>
  )
}
