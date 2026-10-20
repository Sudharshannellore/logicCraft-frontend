import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PixelBar } from '@/components/pixel/PixelBar'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import type { SpriteName } from '@/components/pixel/sprites'
import { cn } from '@/utils/cn'

interface BossArenaProps {
  name: string
  sprite?: SpriteName
  /** A line under the boss, e.g. its taunt or the challenge. */
  caption?: string
  /** Under the hero, e.g. "YOU · LV 7". */
  playerLabel?: string
  /** Seconds on the clock; null shows the time limit instead (the fight hasn't started). */
  secondsLeft: number | null
  timeLimitMinutes: number
  rewardXp: number
  hpPercent: number
}

export function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const STARS = [
  [6, 12], [18, 30], [27, 8], [41, 22], [55, 6], [63, 34], [72, 14], [84, 26], [93, 10], [12, 48], [88, 50], [48, 44],
]

export function BossArena({ name, sprite = 'recursionBoss', caption, playerLabel = 'YOU', secondsLeft, timeLimitMinutes, rewardXp, hpPercent }: BossArenaProps) {
  const [hits, setHits] = useState<{ id: number; x: number }[]>([])
  const [shaking, setShaking] = useState(false)
  const nextId = useRef(0)

  function poke() {
    const id = nextId.current++
    setHits((h) => [...h, { id, x: Math.round(Math.random() * 60 - 30) }])
    setShaking(true)
    window.setTimeout(() => setShaking(false), 320)
    window.setTimeout(() => setHits((h) => h.filter((hit) => hit.id !== id)), 900)
  }

  const lowTime = secondsLeft !== null && secondsLeft < 60

  return (
    <section
      aria-label={`${name} boss battle`}
      className="pixel-frame relative mb-8 overflow-hidden bg-[linear-gradient(180deg,#07070b_0%,#170d24_70%,#2a0f1a_100%)]"
    >
      <div className="pixel-scanlines pointer-events-none absolute inset-0" />
      {STARS.map(([x, y], i) => (
        <span
          key={i}
          className="animate-pixel-twinkle absolute h-1 w-1 bg-white/80"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.31}s` }}
        />
      ))}

      <div className="relative flex flex-col items-center px-4 pt-8 text-center">
        <p className="font-pixel text-sm uppercase tracking-[0.3em] text-[var(--color-error)]">
          ⚔ Boss Battle ⚔
        </p>
        <h1 className="mt-2 font-pixel text-4xl uppercase text-[var(--color-text-primary)] [text-shadow:4px_4px_0_var(--color-error)] sm:text-6xl">
          {name}
        </h1>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="border-2 border-[var(--color-border-strong)] bg-black/50 px-4 py-2">
            <p className="font-pixel text-xs uppercase text-[var(--color-text-muted)]">{secondsLeft === null ? 'Time limit' : 'Time left'}</p>
            <p
              className={cn('font-pixel text-3xl tabular-nums', lowTime ? 'animate-pixel-twinkle text-[var(--color-error)]' : 'text-[var(--color-text-primary)]')}
              aria-live={lowTime ? 'polite' : 'off'}
            >
              {secondsLeft === null ? formatClock(timeLimitMinutes * 60) : formatClock(secondsLeft)}
            </p>
          </div>
          <div className="flex items-center gap-2 border-2 border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)] px-4 py-3">
            <PixelSprite sprite="star" scale={2} fps={2} />
            <span className="font-pixel text-xl text-[var(--color-accent)]">+{rewardXp} XP</span>
          </div>
        </div>
      </div>

      {/* Arena floor */}
      <div className="relative mt-6 grid grid-cols-[1fr_auto_1fr] items-end gap-2 px-4 sm:px-10">
        <div className="flex flex-col items-center gap-2 pb-0">
          <div className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <PixelSprite key={i} sprite="heart" scale={2} />
            ))}
          </div>
          <PixelSprite sprite="hero" scale={5} fps={2} className="animate-pixel-bob" />
          <p className="font-pixel text-sm text-[var(--color-violet)]">{playerLabel}</p>
        </div>

        <p className="mb-16 font-pixel text-3xl text-[var(--color-warning)] [text-shadow:3px_3px_0_var(--pixel-ink)] sm:text-5xl">VS</p>

        <div className="flex flex-col items-center gap-2">
          <div className="w-full max-w-[220px]">
            <div className="mb-1 flex justify-between font-pixel text-xs">
              <span className="text-[var(--color-error)]">BOSS HP</span>
              <span className="text-[var(--color-text-secondary)]">{Math.round(hpPercent)}%</span>
            </div>
            <PixelBar percent={hpPercent} segments={12} color="error" label="Boss health" />
          </div>
          <button
            type="button"
            onClick={poke}
            aria-label="Poke the boss"
            className="relative cursor-crosshair focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-error)]"
          >
            <AnimatePresence>
              {hits.map((hit) => (
                <motion.span
                  key={hit.id}
                  className="pointer-events-none absolute left-1/2 top-4 z-10 font-pixel text-2xl text-[var(--color-warning)] [text-shadow:2px_2px_0_var(--pixel-ink)]"
                  initial={{ opacity: 1, x: hit.x, y: 0 }}
                  animate={{ opacity: 0, y: -48 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  -{8 + (hit.id % 5)}
                </motion.span>
              ))}
            </AnimatePresence>
            <PixelSprite
              sprite={sprite}
              scale={sprite === 'recursionBoss' ? 6 : 8}
              fps={3}
              className={cn(shaking ? 'animate-pixel-shake' : 'animate-pixel-hover')}
            />
          </button>
          {caption && <p className="max-w-[260px] text-center font-pixel text-sm text-[var(--color-error)]">{caption}</p>}
        </div>
      </div>

      <div className="relative mt-3 h-2 bg-[var(--color-error)]/70" />
      <div className="relative h-6 bg-[repeating-linear-gradient(90deg,#2a1218_0_8px,#22101a_8px_16px)]" />
    </section>
  )
}
