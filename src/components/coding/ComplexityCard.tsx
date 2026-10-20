import { PixelBar } from '@/components/pixel/PixelBar'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { cn } from '@/utils/cn'

interface ComplexityCardProps {
  timeComplexity: string
  spaceComplexity: string
  codeQuality: number
  className?: string
}

function qualityRank(score: number) {
  if (score >= 90) return 'S'
  if (score >= 80) return 'A'
  if (score >= 65) return 'B'
  if (score >= 50) return 'C'
  return 'D'
}

export function ComplexityCard({ timeComplexity, spaceComplexity, codeQuality, className }: ComplexityCardProps) {
  return (
    <div className={cn('border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4', className)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="pixel-corners bg-[var(--color-info)]/12 p-3">
          <p className="flex items-center gap-1.5 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            <PixelSprite sprite="lightning" scale={1.25} /> Time
          </p>
          <p className="mt-1 font-pixel text-xl text-[var(--color-info)]">{timeComplexity}</p>
        </div>
        <div className="pixel-corners bg-[var(--color-violet)]/12 p-3">
          <p className="flex items-center gap-1.5 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            <PixelSprite sprite="floppy" scale={1.25} /> Space
          </p>
          <p className="mt-1 font-pixel text-xl text-[var(--color-violet)]">{spaceComplexity}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between gap-3">
          <span className="flex items-center gap-1.5 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
            <PixelSprite sprite="gem" scale={1.25} /> Code Quality
          </span>
          <span className="flex items-baseline gap-2 font-pixel leading-none">
            <span className="text-3xl text-[var(--color-accent)]">{codeQuality}</span>
            <span className="text-sm text-[var(--color-text-muted)]">/100</span>
            <span className="border-2 border-[var(--color-warning)]/50 bg-[var(--color-warning)]/15 px-1.5 py-0.5 text-sm text-[var(--color-warning)]">
              {qualityRank(codeQuality)}
            </span>
          </span>
        </div>
        <PixelBar percent={codeQuality} segments={20} size="md" color="accent" className="mt-2" label="Code quality score" />
      </div>
    </div>
  )
}
