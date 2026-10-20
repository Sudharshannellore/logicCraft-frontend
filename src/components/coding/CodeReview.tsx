import { motion, useReducedMotion } from 'framer-motion'
import type { SubmissionResult } from '@/types'
import { Button } from '@/components/ui/Button'
import { Confetti } from '@/components/ui/Confetti'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { QuestAIAvatar } from '@/components/illustrations/QuestAIAvatar'
import { ComplexityCard } from './ComplexityCard'
import { cn } from '@/utils/cn'

interface CodeReviewActionsProps {
  actions: { label: string; onClick?: () => void }[]
}

function ActionRow({ actions }: CodeReviewActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button key={action.label} type="button" variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ))}
    </div>
  )
}

interface CodeReviewProps {
  result: SubmissionResult
  onShowBetterApproach?: () => void
  onExplainComplexity?: () => void
  onFindEdgeCases?: () => void
  onGiveChallenge?: () => void
  className?: string
}

export function CodeReview({
  result,
  onShowBetterApproach,
  onExplainComplexity,
  onFindEdgeCases,
  onGiveChallenge,
  className,
}: CodeReviewProps) {
  const reduceMotion = useReducedMotion()
  if (!result.aiReview) return null

  return (
    <div className={cn('relative space-y-4 border-2 border-[var(--color-success)]/40 bg-[var(--color-surface)] p-5 shadow-[4px_4px_0_var(--pixel-ink)]', className)}>
      <Confetti fire />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="flex items-center gap-3"
      >
        <div className="pixel-corners flex h-14 w-14 shrink-0 items-center justify-center bg-[var(--color-warning)]/15">
          <PixelSprite sprite="trophy" scale={2.5} className="animate-pixel-bob" />
        </div>
        <div>
          <p className="font-pixel text-lg uppercase tracking-wider text-[var(--color-success)]">Quest Cleared!</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Correct solution. All test cases passed — nice work.</p>
        </div>
      </motion.div>

      <ComplexityCard
        timeComplexity={result.aiReview.timeComplexity}
        spaceComplexity={result.aiReview.spaceComplexity}
        codeQuality={result.aiReview.codeQuality}
      />

      <div className="border-2 border-[var(--color-violet)]/40 bg-[var(--color-violet-soft)] p-4 shadow-[3px_3px_0_var(--pixel-ink)]">
        <div className="mb-2 flex items-center gap-2 font-pixel text-sm text-[var(--color-violet)]">
          <QuestAIAvatar size={20} /> Quest AI recommendation
        </div>
        <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">{result.aiReview.recommendation}</p>
      </div>

      <ActionRow
        actions={[
          { label: 'Show better approach', onClick: onShowBetterApproach },
          { label: 'Explain complexity', onClick: onExplainComplexity },
          { label: 'Find edge cases', onClick: onFindEdgeCases },
          { label: 'Give me a challenge', onClick: onGiveChallenge },
        ]}
      />
    </div>
  )
}

interface CodeReviewFailureProps {
  result: SubmissionResult
  onExplain?: () => void
  onGiveHint?: () => void
  onTryAgain?: () => void
  onShowSimilarExample?: () => void
  className?: string
}

export function CodeReviewFailure({
  result,
  onExplain,
  onGiveHint,
  onTryAgain,
  onShowSimilarExample,
  className,
}: CodeReviewFailureProps) {
  const failingTest = result.testResults.find((t) => !t.passed)

  return (
    <div className={cn('space-y-4 border-2 border-[var(--color-error)]/40 bg-[var(--color-surface)] p-5 shadow-[4px_4px_0_var(--pixel-ink)]', className)}>
      <div className="flex items-center gap-3">
        <div className="pixel-corners flex h-14 w-14 shrink-0 items-end justify-center bg-[var(--color-error)]/15 pb-1.5">
          <PixelSprite sprite="bugSlime" scale={2.5} fps={3} />
        </div>
        <div>
          <p className="font-pixel text-lg uppercase tracking-wider text-[var(--color-error)]">Not quite there yet</p>
          <p className="font-pixel text-sm text-[var(--color-text-secondary)]">
            {result.testResults.filter((t) => t.passed).length}/{result.testResults.length} test cases passed
          </p>
        </div>
      </div>

      {failingTest && (
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 font-mono text-xs">
          <p className="mb-2 text-[var(--color-text-muted)]">Input: {failingTest.input}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="border-2 border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-2.5">
              <p className="mb-1 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Expected</p>
              <p className="text-[var(--color-success)]">{failingTest.expectedOutput}</p>
            </div>
            <div className="border-2 border-[var(--color-error)]/30 bg-[var(--color-error)]/5 p-2.5">
              <p className="mb-1 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Received</p>
              <p className="text-[var(--color-error)]">{failingTest.receivedOutput}</p>
            </div>
          </div>
        </div>
      )}

      {result.aiFailureExplanation && (
        <div className="border-2 border-[var(--color-violet)]/40 bg-[var(--color-violet-soft)] p-4 shadow-[3px_3px_0_var(--pixel-ink)]">
          <div className="mb-2 flex items-center gap-2 font-pixel text-sm text-[var(--color-violet)]">
            <QuestAIAvatar size={20} /> Quest AI says
          </div>
          <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">{result.aiFailureExplanation}</p>
        </div>
      )}

      <ActionRow
        actions={[
          { label: 'Explain', onClick: onExplain },
          { label: 'Give Hint', onClick: onGiveHint },
          { label: 'Try Again', onClick: onTryAgain },
          { label: 'Show Similar Example', onClick: onShowSimilarExample },
        ]}
      />
    </div>
  )
}
