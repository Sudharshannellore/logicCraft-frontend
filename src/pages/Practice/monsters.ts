import type { SpriteName } from '@/components/pixel/sprites'
import type { Difficulty } from '@/types'

/** Each difficulty is a different monster to defeat. */
export const monsters: Record<Difficulty, { sprite: SpriteName; scale: number; fps: number; color: string }> = {
  easy: { sprite: 'slime', scale: 2.25, fps: 0, color: 'var(--color-success)' },
  medium: { sprite: 'bugSlime', scale: 2.25, fps: 0, color: 'var(--color-warning)' },
  hard: { sprite: 'recursionBoss', scale: 1.25, fps: 3, color: 'var(--color-error)' },
}
