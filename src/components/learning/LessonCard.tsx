import { CheckCircle2, ChevronRight, PlayCircle } from 'lucide-react'
import type { CourseModule } from '@/types'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/utils/cn'

interface LessonCardProps {
  module: CourseModule
  active?: boolean
  onClick?: () => void
  className?: string
}

export function LessonCard({ module, active, onClick, className }: LessonCardProps) {
  const isComplete = module.progressPercent >= 100
  const isStarted = module.progressPercent > 0

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-4 transition-colors',
        onClick && 'cursor-pointer hover:border-[var(--color-accent)]',
        active ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-border)]',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          isComplete
            ? 'bg-[var(--color-accent)] text-[#06120a]'
            : isStarted
              ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]',
        )}
      >
        {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{module.title}</p>
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
          {module.completedLessons}/{module.lessonsCount} lessons · {module.exercisesCount} exercises
        </p>
        <ProgressBar percent={module.progressPercent} size="sm" className="mt-2" />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="font-mono text-xs text-[var(--color-text-muted)]">{module.progressPercent}%</span>
        {onClick && <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />}
      </div>
    </div>
  )
}
