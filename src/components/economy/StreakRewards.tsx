import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { playSound } from '@/services/sound'
import { useWalletStore } from '@/stores/walletStore'
import { cn } from '@/utils/cn'

const BURST = [
  { x: -36, y: -46 },
  { x: -12, y: -62 },
  { x: 14, y: -58 },
  { x: 36, y: -40 },
]

export function StreakRewards({ streakDays, className }: { streakDays: number; className?: string }) {
  const { data: milestones = [] } = useQuery({ queryKey: ['streak-milestones'], queryFn: api.getStreakMilestones })
  const queryClient = useQueryClient()
  const setBalance = useWalletStore((s) => s.setBalance)
  const reduceMotion = useReducedMotion()
  const [justClaimed, setJustClaimed] = useState<number | null>(null)
  const [claiming, setClaiming] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const claim = async (days: number) => {
    setClaiming(days)
    setError(null)
    try {
      const { balance } = await api.claimStreakMilestone(days)
      setBalance(balance)
      queryClient.setQueryData(['streak-milestones'], milestones.map((m) => (m.days === days ? { ...m, claimed: true, claimable: false } : m)))
      setJustClaimed(days)
      window.setTimeout(() => setJustClaimed((d) => (d === days ? null : d)), 900)
      playSound('claim')
    } catch (e) {
      setError(errorMessage(e))
      playSound('error')
    } finally {
      setClaiming(null)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <PixelSprite sprite="flame" scale={2} fps={6} /> Streak Rewards
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          You're on a <span className="font-pixel text-[var(--color-warning)]">{streakDays}-day</span> streak. Hit milestones to earn bonus XP.
        </p>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {milestones.map((m) => {
            const isClaimed = m.claimed
            const reached = streakDays >= m.days
            const claimable = m.claimable
            return (
              <li
                key={m.days}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 border-2 p-3 text-center',
                  claimable && 'border-[var(--color-violet)] bg-[var(--color-violet-soft)] shadow-[3px_3px_0_var(--pixel-ink)]',
                  isClaimed && 'border-[var(--color-success)]/40 bg-[var(--color-success)]/5',
                  !reached && 'border-[var(--color-border-strong)] opacity-60',
                )}
              >
                <AnimatePresence>
                  {justClaimed === m.days &&
                    !reduceMotion &&
                    BURST.map((b, i) => (
                      <motion.span
                        key={i}
                        className="pointer-events-none absolute left-1/2 top-6"
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{ x: b.x, y: b.y, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      >
                        <PixelSprite sprite="star" scale={2} />
                      </motion.span>
                    ))}
                </AnimatePresence>
                <span className="font-pixel text-lg leading-none text-[var(--color-warning)]">{m.days}d</span>
                <span className="flex items-center gap-1 font-pixel text-sm text-[var(--color-accent)]">
                  <PixelSprite sprite="star" scale={1.25} />+{m.xp} XP
                </span>
                {isClaimed ? (
                  <span className="flex items-center gap-1 font-pixel text-xs text-[var(--color-success)]">
                    <Check className="h-3 w-3" strokeWidth={3} /> Claimed
                  </span>
                ) : claimable ? (
                  <button
                    type="button"
                    onClick={() => void claim(m.days)}
                    disabled={claiming !== null}
                    className="pixel-btn w-full bg-[var(--color-violet)] px-2 py-1 font-pixel text-xs text-[#140b2e]"
                  >
                    {claiming === m.days ? 'Claiming…' : 'Claim'}
                  </button>
                ) : (
                  <span className="font-pixel text-[11px] text-[var(--color-text-muted)]">{m.days - streakDays} days to go</span>
                )}
              </li>
            )
          })}
        </ol>
        {error && (
          <p role="alert" className="mt-3 text-sm text-[var(--color-error)]">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
