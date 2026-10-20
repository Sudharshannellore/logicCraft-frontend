import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Confetti } from '@/components/ui/Confetti'
import { PixelBar } from '@/components/pixel/PixelBar'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import type { DailyQuest } from '@/types'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { useWalletStore } from '@/stores/walletStore'
import { cn } from '@/utils/cn'

export function QuestCard({ quest }: { quest: DailyQuest }) {
  const complete = quest.tasks.every((t) => t.done)
  const queryClient = useQueryClient()
  const setBalance = useWalletStore((s) => s.setBalance)
  const [claiming, setClaiming] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const claim = async () => {
    setClaiming(true)
    setError(null)
    try {
      const result = await api.claimDailyQuest()
      setBalance(result.balance)
      queryClient.setQueryData(['daily-quest'], result.quest)
      setCelebrate(true)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setClaiming(false)
    }
  }

  return (
    <Card className="pixel-scanlines relative overflow-hidden border-2 border-[var(--color-accent)]/30">
      {celebrate && <Confetti fire count={28} />}
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-pixel text-sm uppercase tracking-wider text-[var(--color-accent)]">Today's Coding Quest</p>
            <h3 className="mt-1 text-xl font-semibold">{quest.title}</h3>
          </div>
          <div className="flex flex-col items-center gap-1">
            <PixelSprite sprite={complete ? 'chestOpened' : 'chest'} scale={3} className={cn(!complete && 'animate-pixel-bob')} />
            <span className="font-pixel text-sm text-[var(--color-warning)]">+{quest.rewardXp} XP</span>
          </div>
        </div>

        <PixelBar percent={quest.progressPercent} segments={10} size="lg" className="mt-4" label="Quest progress" />

        <ol className="mt-5 grid gap-2 sm:grid-cols-2">
          {quest.tasks.map((task, i) => (
            <li
              key={task.id}
              className={cn(
                'flex items-center gap-2.5 border-2 px-3 py-2 text-sm',
                task.done
                  ? 'border-[var(--color-accent)]/25 bg-[var(--color-accent-soft)] text-[var(--color-text-muted)]'
                  : 'border-[var(--color-border-strong)] text-[var(--color-text-primary)]',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center font-pixel text-xs',
                  task.done ? 'bg-[var(--color-accent)] text-[#06120a]' : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]',
                )}
              >
                {task.done ? <Check className="h-3.5 w-3.5" strokeWidth={4} /> : i + 1}
              </span>
              <span className={cn('flex-1', task.done && 'line-through')}>{task.label}</span>
              {task.target > 1 && !task.done && (
                <span className="font-pixel text-xs text-[var(--color-text-muted)]">
                  {task.progress}/{task.target}
                </span>
              )}
            </li>
          ))}
        </ol>

        {quest.claimed ? (
          <p className="mt-6 flex items-center justify-center gap-2 border-2 border-[var(--color-success)]/40 bg-[var(--color-success)]/10 py-3 font-pixel text-[var(--color-success)]">
            <Check className="h-4 w-4" strokeWidth={3} /> Reward claimed — come back tomorrow
          </p>
        ) : quest.claimable ? (
          <Button variant="pixel" size="lg" className="mt-6 w-full text-lg" onClick={() => void claim()} disabled={claiming}>
            {claiming ? 'Claiming…' : `Claim ${quest.rewardXp} XP`}
          </Button>
        ) : (
          <Link to="/practice" className={cn(buttonVariants({ variant: 'pixel', size: 'lg' }), 'mt-6 w-full text-lg')}>
            Continue Quest
          </Link>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-[var(--color-error)]">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
