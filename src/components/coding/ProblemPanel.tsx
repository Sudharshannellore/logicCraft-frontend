import { useState } from 'react'
import type { Problem } from '@/types'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { Markdown } from '@/components/ui/Markdown'
import { cn } from '@/utils/cn'

type Tab = 'problem' | 'hints'

interface ProblemPanelProps {
  problem: Problem
  className?: string
}

function SectionLabel({ children }: { children: string }) {
  return <h2 className="mb-2.5 mt-6 font-pixel text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{children}</h2>
}

export function ProblemPanel({ problem, className }: ProblemPanelProps) {
  const [tab, setTab] = useState<Tab>('problem')
  const [revealed, setRevealed] = useState<number[]>([])

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'problem', label: 'Problem' },
    { id: 'hints', label: 'Hints', count: problem.hints.length },
  ]

  return (
    <div className={cn('flex h-full flex-col overflow-hidden bg-[var(--color-surface)]', className)}>
      <div className="flex h-11 shrink-0 items-end gap-1 border-b-2 border-[var(--pixel-ink)] px-3" role="tablist" aria-label="Problem sections">
        {tabs.map((t) => {
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 pb-2 pt-1.5 font-pixel text-sm transition-colors',
                isActive
                  ? 'text-[var(--color-accent)] shadow-[inset_0_-3px_0_var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              )}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="bg-[var(--color-violet)] px-1.5 text-[11px] leading-4 text-[#0b0d12]">{t.count}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="pixel-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {tab === 'problem' && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {problem.tags.map((tag) => (
                <span key={tag} className="border-2 border-[var(--color-border-strong)] px-2 py-0.5 font-pixel text-[11px] text-[var(--color-text-secondary)]">
                  {tag}
                </span>
              ))}
              <span className="ml-auto font-pixel text-xs text-[var(--color-text-muted)]">{problem.acceptanceRate == null ? 'New problem' : `${problem.acceptanceRate}% acceptance`}</span>
            </div>

            <Markdown text={problem.description} className="text-[15px] leading-7 text-[var(--color-text-primary)]" />

            <SectionLabel>Examples</SectionLabel>
            <div className="space-y-3">
              {problem.examples.map((example, i) => (
                <div key={i} className="border-l-4 border-[var(--color-accent)]/50 bg-[var(--color-bg)] px-4 py-3">
                  <p className="mb-1.5 font-pixel text-xs text-[var(--color-accent)]">Example {i + 1}</p>
                  <div className="space-y-1 font-mono text-[13px]">
                    <p>
                      <span className="text-[var(--color-text-muted)]">Input: </span>
                      <span className="text-[var(--color-text-primary)]">{example.input}</span>
                    </p>
                    <p>
                      <span className="text-[var(--color-text-muted)]">Output: </span>
                      <span className="text-[var(--color-text-primary)]">{example.output}</span>
                    </p>
                  </div>
                  {example.explanation && <p className="mt-1.5 text-[13px] text-[var(--color-text-secondary)]">{example.explanation}</p>}
                </div>
              ))}
            </div>

            {problem.constraints.length > 0 && <SectionLabel>Constraints</SectionLabel>}
            <ul className="space-y-2 font-mono text-[13px]">
              {problem.constraints.map((constraint, i) => (
                <li key={i} className="flex gap-2.5">
                  <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-[var(--color-accent)]" />
                  <span className="text-[var(--color-text-primary)]">{constraint}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === 'hints' && (
          <div className="space-y-3">
            <p className="text-[13px] text-[var(--color-text-muted)]">Stuck? Reveal hints one at a time — each one nudges, none gives the answer away.</p>
            {problem.hints.map((hint, i) => {
              const isRevealed = revealed.includes(i)
              const isNext = !isRevealed && i === revealed.length
              return isRevealed ? (
                <div key={i} className="flex items-start gap-3 border-2 border-[var(--color-violet)]/40 bg-[var(--color-violet-soft)] p-3">
                  <PixelSprite sprite="scroll" scale={2} className="mt-0.5" />
                  <div>
                    <p className="mb-0.5 font-pixel text-xs uppercase tracking-wider text-[var(--color-violet)]">Hint {i + 1}</p>
                    <p className="text-[var(--color-text-primary)]">{hint}</p>
                  </div>
                </div>
              ) : (
                <button
                  key={i}
                  type="button"
                  disabled={!isNext}
                  onClick={() => setRevealed((prev) => [...prev, i])}
                  className="group flex w-full items-center gap-3 border-2 border-dashed border-[var(--color-border-strong)] p-3 text-left font-pixel text-sm text-[var(--color-text-secondary)] transition-colors enabled:hover:border-[var(--color-violet)] enabled:hover:text-[var(--color-violet)] disabled:opacity-50"
                >
                  <PixelSprite sprite={isNext ? 'potion' : 'lock'} scale={2} className={cn(isNext && 'group-hover:animate-pixel-bob')} />
                  {isNext ? `Reveal hint ${i + 1}` : `Hint ${i + 1} — reveal the previous one first`}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
