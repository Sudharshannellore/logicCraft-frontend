import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { CountUp } from '@/components/ui/CountUp'
import { buttonVariants } from '@/components/ui/Button'
import { playSound } from '@/services/sound'
import { cn } from '@/utils/cn'

interface VictoryOverlayProps {
  open: boolean
  xp: number
  /** XP actually paid out for this solve; 0 means it was already earned on an earlier solve. */
  awardedXp?: number
  title?: string
  /** Extra content under the title, e.g. a duel result. */
  extra?: React.ReactNode
  onClose: () => void
}

const HEADLINE = 'QUEST CLEAR!'

export function VictoryOverlay({ open, xp, awardedXp, title = 'Problem solved', extra, onClose }: VictoryOverlayProps) {
  const reduceMotion = useReducedMotion()
  const closeRef = useRef<HTMLButtonElement>(null)

  const coins = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: (i * 37) % 100,
        delay: (i % 9) * 0.12,
        duration: 1.6 + ((i * 13) % 7) * 0.15,
        sprite: 'star' as const,
      })),
    [],
  )

  useEffect(() => {
    if (open) playSound('victory')
  }, [open])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="victory-title"
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-black/75 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {!reduceMotion &&
            coins.map((c) => (
              <motion.div
                key={c.id}
                className="pointer-events-none absolute -top-10"
                style={{ left: `${c.left}%` }}
                initial={{ y: -40, rotate: 0 }}
                animate={{ y: '110vh', rotate: c.id % 2 ? 90 : -90 }}
                transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn', repeat: Infinity, repeatDelay: 0.4 }}
              >
                <PixelSprite sprite={c.sprite} scale={3} fps={2} />
              </motion.div>
            ))}

          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="pixel-frame relative w-full max-w-md bg-[var(--color-surface)] px-6 pb-6 pt-8 text-center shadow-[0_0_0_2px_var(--color-accent),8px_8px_0_var(--color-accent-strong)]"
            initial={reduceMotion ? false : { scale: 0.4, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          >
            <div className="pixel-scanlines pointer-events-none absolute inset-0" />

            <h2 id="victory-title" className="relative flex justify-center font-pixel text-4xl text-[var(--color-accent)] [text-shadow:3px_3px_0_var(--color-violet-strong)] sm:text-5xl">
              {HEADLINE.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  className={cn(ch === ' ' && 'w-3')}
                  initial={reduceMotion ? false : { y: -60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 14, delay: 0.15 + i * 0.05 }}
                >
                  {ch}
                </motion.span>
              ))}
            </h2>
            <p className="relative mt-1 text-sm text-[var(--color-text-secondary)]">{title}</p>
            {extra && <div className="relative mt-3">{extra}</div>}

            <div className="relative mx-auto mt-6 flex items-end justify-center gap-6">
              <PixelSprite sprite="hero" scale={5} className="animate-pixel-bob" />
              <motion.div
                initial={reduceMotion ? false : { rotate: -8, scale: 0.6 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 10, delay: 0.6 }}
              >
                <PixelSprite sprite="chestOpened" scale={5} />
              </motion.div>
            </div>
            <div className="relative mx-auto h-2 w-56 bg-[var(--color-accent)]" />

            {awardedXp === 0 ? (
              <p className="relative mt-5 font-pixel text-base text-[var(--color-text-secondary)]">
                Solved again — XP for this problem was already earned.
              </p>
            ) : (
              <motion.p
                className="relative mt-5 flex items-center justify-center gap-2 font-pixel text-4xl text-[var(--color-warning)] [text-shadow:2px_2px_0_var(--pixel-ink)]"
                initial={reduceMotion ? false : { scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.9, duration: 0.45 }}
              >
                <PixelSprite sprite="star" scale={3} fps={2} />+<CountUp value={awardedXp ?? xp} duration={900} /> XP
              </motion.p>
            )}
            <p className="relative mt-1 font-pixel text-xs uppercase tracking-widest text-[var(--color-text-muted)]">Streak protected · Quest +1</p>

            <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/challenges" className={cn(buttonVariants({ variant: 'pixel', size: 'lg' }), 'flex-1')}>
                Optimization Challenge
              </Link>
              <button ref={closeRef} type="button" onClick={onClose} className={cn(buttonVariants({ variant: 'pixelDark', size: 'lg' }), 'flex-1')}>
                Keep Coding
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
