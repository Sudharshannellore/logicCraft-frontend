import { PixelSprite } from '@/components/pixel/PixelSprite'
import { cn } from '@/utils/cn'

export function StreakCard({ days, className }: { days: number; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 border-2 border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-3 py-1.5 shadow-[3px_3px_0_var(--pixel-ink)]',
        className,
      )}
    >
      <PixelSprite sprite="flame" scale={2} fps={6} />
      <span className="font-pixel text-lg leading-none text-[var(--color-warning)]">{days}</span>
      <span className="text-xs font-medium text-[var(--color-text-secondary)]">day streak</span>
    </div>
  )
}
