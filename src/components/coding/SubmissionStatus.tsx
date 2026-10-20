import { PixelSprite } from '@/components/pixel/PixelSprite'
import type { SpriteName } from '@/components/pixel/sprites'
import { cn } from '@/utils/cn'

export type SubmissionStatusKind = 'idle' | 'running' | 'passed' | 'failed' | 'error'

interface SubmissionStatusProps {
  status: SubmissionStatusKind
  className?: string
}

const config: Record<SubmissionStatusKind, { label: string; sprite: SpriteName; fps?: number; className: string }> = {
  idle: {
    label: 'Not run yet',
    sprite: 'terminal',
    className: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border-[var(--color-border-strong)]',
  },
  running: {
    label: 'Running tests…',
    sprite: 'heroRun',
    fps: 8,
    className: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/40',
  },
  passed: {
    label: 'All tests passed',
    sprite: 'star',
    fps: 3,
    className: 'bg-[var(--color-success)]/15 text-[var(--color-success)] border-[var(--color-success)]/40',
  },
  failed: {
    label: 'Tests failed',
    sprite: 'bugSlime',
    className: 'bg-[var(--color-error)]/15 text-[var(--color-error)] border-[var(--color-error)]/40',
  },
  error: {
    label: 'Execution error',
    sprite: 'bug',
    className: 'bg-[var(--color-error)]/15 text-[var(--color-error)] border-[var(--color-error)]/40',
  },
}

export function SubmissionStatus({ status, className }: SubmissionStatusProps) {
  const { label, sprite, fps, className: colorClassName } = config[status]
  return (
    <div
      role="status"
      className={cn(
        'inline-flex items-center gap-2 border-2 px-2.5 py-1 font-pixel text-sm shadow-[2px_2px_0_var(--pixel-ink)]',
        colorClassName,
        className,
      )}
    >
      <PixelSprite sprite={sprite} scale={1.5} fps={fps} />
      {label}
    </div>
  )
}
