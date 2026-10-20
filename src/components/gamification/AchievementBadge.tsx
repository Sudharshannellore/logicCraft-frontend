import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { isSpriteName } from '@/components/pixel/sprites'
import type { Achievement } from '@/types'
import { cn } from '@/utils/cn'

const rarityStyles: Record<Achievement['rarity'], string> = {
  common: 'border-[var(--color-border-strong)]',
  rare: 'border-[var(--color-info)]/40',
  epic: 'border-[var(--color-violet)]/40',
  legendary: 'border-[var(--color-warning)]/50',
}

const rarityText: Record<Achievement['rarity'], string> = {
  common: 'text-[var(--color-text-muted)]',
  rare: 'text-[var(--color-info)]',
  epic: 'text-[var(--color-violet)]',
  legendary: 'text-[var(--color-warning)]',
}

export function AchievementBadge({ achievement, delay = 0 }: { achievement: Achievement; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 280, damping: 20, delay }}
      whileHover={achievement.unlocked ? { y: -4, scale: 1.02 } : undefined}
      className={cn(
        'group relative flex flex-col items-center gap-2 overflow-hidden border-2 bg-[var(--color-surface)] p-5 text-center shadow-[4px_4px_0_var(--pixel-ink)]',
        rarityStyles[achievement.rarity],
        !achievement.unlocked && 'opacity-60',
      )}
    >
      {achievement.unlocked && achievement.rarity === 'legendary' && (
        <div className="animate-shimmer absolute inset-0" />
      )}
      <div className="pixel-corners relative flex h-20 w-20 items-center justify-center bg-[var(--color-surface-elevated)]">
        {isSpriteName(achievement.icon) ? (
          <PixelSprite
            sprite={achievement.icon}
            scale={4}
            fps={achievement.unlocked ? 3 : 0}
            className={cn(achievement.unlocked ? 'group-hover:animate-pixel-bob' : 'brightness-0 invert opacity-20')}
          />
        ) : (
          <span className="text-3xl">{achievement.icon}</span>
        )}
        {!achievement.unlocked && <Lock className="absolute h-5 w-5 text-[var(--color-text-secondary)]" />}
      </div>
      <p className="relative font-pixel text-base text-[var(--color-text-primary)]">{achievement.title}</p>
      <p className={cn('relative font-pixel text-[11px] uppercase tracking-wider', rarityText[achievement.rarity])}>{achievement.rarity}</p>
      <p className="relative text-xs text-[var(--color-text-muted)]">{achievement.description}</p>
      {achievement.unlocked && achievement.unlockedAt && (
        <p className="relative text-[10px] font-mono uppercase tracking-wide text-[var(--color-text-muted)]">
          {new Date(achievement.unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}
    </motion.div>
  )
}
