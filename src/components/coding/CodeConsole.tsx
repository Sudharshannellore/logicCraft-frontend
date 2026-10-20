import { AnimatePresence, motion } from 'framer-motion'
import type { Problem, SubmissionResult } from '@/types'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { TestResults } from './TestResults'
import { SubmissionStatus, type SubmissionStatusKind } from './SubmissionStatus'
import { CodeReview, CodeReviewFailure } from './CodeReview'
import { cn } from '@/utils/cn'

export type ConsoleTab = 'testcases' | 'results' | 'review'

interface CodeConsoleProps {
  problem: Problem
  tab: ConsoleTab
  onTabChange: (tab: ConsoleTab) => void
  result: SubmissionResult | null
  isRunning: boolean
  submitted: boolean
  onTryAgain: () => void
  className?: string
}

/** Renders child panels without their own card chrome — the console pane is the frame. */
const flush = 'h-full border-0 bg-transparent shadow-none'

export function CodeConsole({ problem, tab, onTabChange, result, isRunning, submitted, onTryAgain, className }: CodeConsoleProps) {
  const status: SubmissionStatusKind = isRunning ? 'running' : result ? result.status : 'idle'
  const tabs: { id: ConsoleTab; label: string; disabled?: boolean }[] = [
    { id: 'testcases', label: 'Testcases' },
    { id: 'results', label: 'Results' },
    { id: 'review', label: 'AI Review', disabled: !submitted || isRunning },
  ]

  return (
    <div className={cn('@container flex h-full flex-col overflow-hidden bg-[var(--color-surface)]', className)}>
      <div className="flex h-11 shrink-0 items-end justify-between gap-2 border-b-2 border-[var(--pixel-ink)] px-2 @[520px]:px-3">
        <div className="flex items-end gap-1" role="tablist" aria-label="Console">
          {tabs.map((t) => {
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={t.disabled}
                onClick={() => onTabChange(t.id)}
                title={t.id === 'review' && t.disabled ? 'Submit your solution to unlock the AI review' : undefined}
                className={cn(
                  'whitespace-nowrap px-2 pb-2 pt-1.5 font-pixel text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 @[520px]:px-3',
                  isActive
                    ? 'text-[var(--color-accent)] shadow-[inset_0_-3px_0_var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] enabled:hover:text-[var(--color-text-primary)]',
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
        <div className="flex shrink-0 items-center gap-3 pb-1.5">
          <AnimatePresence>
            {!isRunning && result?.status === 'failed' && (
              <motion.span
                className="hidden items-center gap-1.5 whitespace-nowrap font-pixel text-xs text-[var(--color-error)] @[640px]:flex"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14 }}
              >
                BUG FOUND!
                <PixelSprite sprite="bugSlime" scale={1.5} fps={4} />
              </motion.span>
            )}
          </AnimatePresence>
          <SubmissionStatus status={status} className="hidden whitespace-nowrap @[440px]:flex" />
        </div>
      </div>

      <div className="pixel-scroll min-h-0 flex-1 overflow-y-auto">
        {tab === 'testcases' && (
          <div className="space-y-2.5 p-4">
            {problem.testCases.map((tc, i) => (
              <div key={tc.id} className="border-l-4 border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-2.5 font-mono text-[13px]">
                <p className="mb-1 font-pixel text-xs text-[var(--color-text-muted)]">Case {i + 1}</p>
                <p>
                  <span className="text-[var(--color-text-muted)]">Input: </span>
                  <span className="text-[var(--color-text-primary)]">{tc.input}</span>
                </p>
                <p>
                  <span className="text-[var(--color-text-muted)]">Expected: </span>
                  <span className="text-[var(--color-text-primary)]">{tc.expectedOutput}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === 'results' && (
          <TestResults
            testResults={result?.testResults ?? null}
            status={isRunning ? 'running' : (result?.status ?? 'idle')}
            runtimeMs={result?.runtimeMs}
            memoryMb={result?.memoryMb}
            error={result?.error}
            stdout={result?.stdout}
            className={flush}
          />
        )}

        {tab === 'review' &&
          result &&
          !isRunning &&
          (result.aiReview ? <CodeReview result={result} className={flush} /> : <CodeReviewFailure result={result} onTryAgain={onTryAgain} className={flush} />)}
      </div>
    </div>
  )
}
