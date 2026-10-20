import { Link } from 'react-router-dom'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { buttonVariants } from '@/components/ui/Button'
import { AI_ANSWER_COST, useWalletStore } from '@/stores/walletStore'
import { cn } from '@/utils/cn'

/** Live spendable XP balance. */
export function XpBalance({ className }: { className?: string }) {
  const xp = useWalletStore((s) => s.xp)
  return (
    <span
      title={`Your XP balance — earn it by learning and solving, spend it on Quest AI (${AI_ANSWER_COST} XP per answer).`}
      className={cn(
        'inline-flex items-center gap-1 border-2 border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)] px-1.5 py-0.5 font-pixel text-xs text-[var(--color-accent)]',
        className,
      )}
    >
      <PixelSprite sprite="star" scale={1} />
      {xp.toLocaleString()} XP
    </span>
  )
}

/** Shown in place of AI inputs when the balance can't cover an answer. */
export function NotEnoughXp({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 border-2 border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3', className)}>
      <PixelSprite sprite="star" scale={2} className="animate-pixel-twinkle" />
      <div className="min-w-0 flex-1">
        <p className="font-pixel text-sm text-[var(--color-warning)]">Not enough XP</p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Each Quest AI answer costs {AI_ANSWER_COST} XP. Earn more by finishing lessons and solving problems.
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <Link to="/practice" className={buttonVariants({ variant: 'pixel', size: 'sm' })}>
          Earn XP
        </Link>
        <Link to="/subscription" className="text-center font-pixel text-[11px] text-[var(--color-accent)] hover:underline">
          or get XP
        </Link>
      </div>
    </div>
  )
}
