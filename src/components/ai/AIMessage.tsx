import type { AIMessage as AIMessageType } from '@/types'
import { QuestAIAvatar } from '@/components/illustrations/QuestAIAvatar'
import { cn } from '@/utils/cn'

interface AIMessageProps {
  message: AIMessageType
  className?: string
}

export function AIMessage({ message, className }: AIMessageProps) {
  const isAI = message.role === 'ai'
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (isAI) {
    return (
      <div className={cn('flex items-start gap-2.5', className)}>
        <div className="pixel-corners flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--color-violet-soft)]">
          <QuestAIAvatar size={22} />
        </div>
        <div className="max-w-[85%]">
          <div className="border-2 border-[var(--color-violet)]/40 bg-[var(--color-violet-soft)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--color-text-primary)] shadow-[3px_3px_0_var(--pixel-ink)]">
            {message.text}
          </div>
          <p className="mt-1.5 pl-0.5 font-pixel text-[11px] text-[var(--color-text-muted)]">
            <span className="text-[var(--color-violet)]">Quest AI</span> · {time}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-start justify-end gap-2.5', className)}>
      <div className="max-w-[85%]">
        <div className="border-2 border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--color-text-primary)] shadow-[3px_3px_0_var(--pixel-ink)]">
          {message.text}
        </div>
        <p className="mt-1.5 pr-0.5 text-right font-pixel text-[11px] text-[var(--color-text-muted)]">You · {time}</p>
      </div>
    </div>
  )
}

/** Three square dots blinking in sequence while Quest AI "types". */
export function AITypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-start gap-2.5', className)} role="status" aria-label="Quest AI is typing">
      <div className="pixel-corners flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--color-violet-soft)]">
        <QuestAIAvatar size={22} />
      </div>
      <div className="flex items-center gap-1.5 border-2 border-[var(--color-violet)]/40 bg-[var(--color-violet-soft)] px-3.5 py-3 shadow-[3px_3px_0_var(--pixel-ink)]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-pixel-twinkle h-2 w-2 bg-[var(--color-violet)]"
            style={{ animationDuration: '0.9s', animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
    </div>
  )
}
