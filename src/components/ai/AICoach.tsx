import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { SendHorizontal } from 'lucide-react'
import type { AIMessage as AIMessageType } from '@/types'
import { AIMessage, AITypingIndicator } from './AIMessage'
import { QuestAIAvatar } from '@/components/illustrations/QuestAIAvatar'
import { NotEnoughXp, XpBalance } from '@/components/economy/EconomyBits'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { matchSuggestions } from '@/services/questAi'
import { errorMessage } from '@/services/api/client'
import { playSound } from '@/services/sound'
import { AI_ANSWER_COST, useWalletStore } from '@/stores/walletStore'
import { cn } from '@/utils/cn'

interface AICoachProps {
  messages: AIMessageType[]
  /** Asks Quest AI on the server (which charges the XP); the page appends the question and the reply. */
  onAsk?: (question: string) => Promise<void> | void
  /** Questions related to the current problem or lesson, most useful first. */
  suggestions?: string[]
  className?: string
}

const MAX_LENGTH = 300

export function AICoach({ messages, onAsk, suggestions = [], className }: AICoachProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [asked, setAsked] = useState<string[]>([])
  const scroller = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)

  const xp = useWalletStore((s) => s.xp)

  const visible = messages
  const typing = pending

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [visible.length, typing])

  // Grow the input with its content, up to a few lines.
  useEffect(() => {
    const el = field.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  const shown = useMemo(() => {
    const fresh = suggestions.filter((s) => !asked.includes(s))
    return input.trim() ? matchSuggestions(fresh, input, 3) : fresh.slice(0, 3)
  }, [suggestions, asked, input])

  const ask = async (question: string) => {
    const q = question.trim()
    if (!q || pending || xp < AI_ANSWER_COST) return
    setPending(true)
    setError(null)
    setAsked((a) => [...a, q])
    setInput('')
    try {
      await onAsk?.(q)
      playSound('aiReply')
    } catch (e) {
      setError(errorMessage(e))
      setInput(q)
      playSound('error')
    } finally {
      setPending(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void ask(input)
  }

  return (
    <div className={cn('flex h-full flex-col overflow-hidden border-2 border-[var(--color-violet)]/40 bg-[var(--color-surface)] shadow-[4px_4px_0_var(--pixel-ink)]', className)}>
      <div className="flex items-center gap-3 border-b-2 border-[var(--color-border)] px-4 py-3">
        <div className="pixel-corners relative flex h-10 w-10 items-center justify-center bg-[var(--color-violet-soft)]">
          <QuestAIAvatar size={28} animated />
        </div>
        <div>
          <p className="font-pixel text-base leading-tight text-[var(--color-text-primary)]">Quest AI</p>
          <p className="flex items-center gap-1.5 font-pixel text-[11px] text-[var(--color-success)]">
            <span aria-hidden className="animate-pixel-twinkle h-2 w-2 bg-[var(--color-success)]" />
            {typing ? 'Typing…' : 'Online · mentor active'}
          </p>
        </div>
        <XpBalance className="ml-auto mr-10" />
      </div>

      <div ref={scroller} className="pixel-scroll flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {visible.length === 0 && !typing ? (
          <p className="text-center text-sm text-[var(--color-text-muted)]">Quest AI is watching your progress and will chime in when it can help.</p>
        ) : (
          visible.map((message) => <AIMessage key={message.id} message={message} />)
        )}
        {typing && <AITypingIndicator />}
      </div>

      <div className="border-t-2 border-[var(--color-border)] p-3">
        {xp < AI_ANSWER_COST ? (
          <NotEnoughXp />
        ) : (
          <>
            {shown.length > 0 && (
              <div className="mb-2.5">
                <p className="mb-1.5 px-0.5 font-pixel text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
                  {input.trim() ? 'Related questions' : 'Suggested questions'}
                </p>
                <ul className="space-y-1.5" aria-label="Suggested questions">
                  {shown.map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        onClick={() => void ask(q)}
                        disabled={typing}
                        className="group flex w-full items-center gap-2 border-2 border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-2.5 py-1.5 text-left text-[13px] text-[var(--color-text-primary)] transition-[border-color,color,transform] duration-75 hover:-translate-y-0.5 hover:border-[var(--color-violet)] hover:text-[var(--color-violet)] disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        <span aria-hidden className="font-pixel text-[var(--color-violet)]">?</span>
                        <span className="min-w-0 flex-1">{q}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <p role="alert" className="mb-2 text-xs text-[var(--color-error)]">
                {error}
              </p>
            )}
            <form onSubmit={submit} className="flex items-end gap-2 border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] p-1.5 focus-within:border-[var(--color-violet)]">
              <textarea
                ref={field}
                rows={1}
                value={input}
                maxLength={MAX_LENGTH}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void ask(input)
                  }
                }}
                aria-label="Ask Quest AI a question"
                placeholder="Ask anything about this…"
                className="pixel-scroll max-h-[120px] min-w-0 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                aria-label={`Send question (${AI_ANSWER_COST} XP)`}
                className="flex h-9 shrink-0 items-center gap-1.5 bg-[var(--color-violet)] px-2.5 font-pixel text-xs text-[#140b2e] transition-opacity disabled:opacity-40"
              >
                <SendHorizontal className="h-4 w-4" />
                {AI_ANSWER_COST} XP
              </button>
            </form>
            <p className="mt-1.5 flex items-center justify-between px-0.5 text-[11px] text-[var(--color-text-muted)]">
              <span>Enter to send · Shift+Enter for a new line</span>
              <span className="flex items-center gap-1 text-[var(--color-warning)]">
                <PixelSprite sprite="star" scale={1} /> {AI_ANSWER_COST} XP per answer
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
