import { CountUp } from '@/components/ui/CountUp'
import { PixelBar } from '@/components/pixel/PixelBar'

export function XPBar({ xp, xpToNextLevel, className }: { xp: number; xpToNextLevel: number; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-pixel text-base text-[var(--color-accent)]">
          <CountUp value={xp} suffix=" XP" />
        </span>
        <span className="font-pixel text-sm text-[var(--color-text-muted)]">{xpToNextLevel.toLocaleString()} XP</span>
      </div>
      <PixelBar percent={(xp / xpToNextLevel) * 100} segments={24} label="Experience toward next level" />
    </div>
  )
}
