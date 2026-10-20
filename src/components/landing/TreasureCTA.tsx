import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { buttonVariants } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'

const burst = [
  { x: -70, y: -90, d: 0 },
  { x: -30, y: -120, d: 0.05 },
  { x: 10, y: -135, d: 0.02 },
  { x: 48, y: -110, d: 0.08 },
  { x: 80, y: -80, d: 0.04 },
]

export function TreasureCTA() {
  const [open, setOpen] = useState(false)
  const signedIn = useAuthStore((s) => !!s.accessToken)

  return (
    <section
      className="mx-auto max-w-4xl px-6 py-24 text-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <div className="relative mx-auto mb-8 flex h-24 w-28 items-end justify-center">
        <AnimatePresence>
          {open &&
            burst.map((c, i) => (
              <motion.div
                key={i}
                className="absolute bottom-10"
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x: c.x, y: c.y, opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, delay: c.d, ease: 'easeOut' }}
              >
                <PixelSprite sprite="star" scale={3} fps={2} />
              </motion.div>
            ))}
        </AnimatePresence>
        <PixelSprite sprite={open ? 'chestOpened' : 'chest'} scale={6} className={cn(!open && 'animate-pixel-bob')} />
      </div>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Your first quest <span className="font-pixel text-[var(--color-accent)]">is waiting.</span>
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[var(--color-text-secondary)]">
        Open the chest: 200 starter XP, your first quest, and a seat on the leaderboard.
      </p>
      <Link to={signedIn ? '/dashboard' : '/signup'} className={cn(buttonVariants({ variant: 'pixel', size: 'lg' }), 'mt-8 inline-flex text-lg')}>
        {signedIn ? 'Back to your quest' : 'Claim Starter Loot'}
      </Link>
    </section>
  )
}
