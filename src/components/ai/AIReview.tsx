import type { ReactNode } from 'react'
import { QuestAIAvatar } from '@/components/illustrations/QuestAIAvatar'
import { cn } from '@/utils/cn'

interface AIReviewProps {
  loading?: boolean
  loadingText?: string
  title?: string
  children?: ReactNode
  className?: string
}

export function AIReview({ loading, loadingText = 'Quest AI is reviewing your solution…', title = 'Quest AI', children, className }: AIReviewProps) {
  return (
    <div className={cn('border-2 border-[var(--color-violet)]/40 bg-[var(--color-violet-soft)] p-4 shadow-[3px_3px_0_var(--pixel-ink)]', className)}>
      <div className="mb-3 flex items-center gap-2.5">
        <div className="pixel-corners flex h-8 w-8 items-center justify-center bg-[var(--color-violet)]/20">
          <QuestAIAvatar size={22} animated={loading} />
        </div>
        <span className="font-pixel text-sm text-[var(--color-violet)]">{title}</span>
      </div>

      {loading ? (
        <div role="status" className="flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)]">
          <span aria-hidden className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="animate-pixel-twinkle h-2 w-2 bg-[var(--color-violet)]"
                style={{ animationDuration: '0.9s', animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </span>
          {loadingText}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
