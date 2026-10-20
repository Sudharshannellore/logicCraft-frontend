import type { TestResult } from '@/types'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { cn } from '@/utils/cn'

interface TestResultsProps {
  testResults: TestResult[] | null
  status: 'idle' | 'running' | 'passed' | 'failed' | 'error'
  runtimeMs?: number | null
  memoryMb?: number | null
  /** Why the code couldn't run (syntax error, time or memory limit…). */
  error?: string | null
  /** What the program printed. */
  stdout?: string
  className?: string
}

const panel = 'border-2 bg-[var(--color-surface)] shadow-[4px_4px_0_var(--pixel-ink)]'

function Console({ stdout }: { stdout?: string }) {
  if (!stdout?.trim()) return null
  return (
    <div className="border-t-2 border-[var(--color-border)] px-4 py-3">
      <p className="mb-1.5 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Your output</p>
      <pre className="pixel-scroll max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs text-[var(--color-text-secondary)]">{stdout}</pre>
    </div>
  )
}

export function TestResults({ testResults, status, runtimeMs, memoryMb, error, stdout, className }: TestResultsProps) {
  if (status === 'running') {
    return (
      <div
        role="status"
        className={cn(panel, 'flex h-full flex-col items-center justify-center gap-3 border-[var(--color-accent)]/40 p-6 text-center', className)}
      >
        <PixelSprite sprite="heroRun" scale={3} fps={8} />
        <p className="font-pixel text-sm uppercase tracking-widest text-[var(--color-accent)]">
          Running tests
          <span aria-hidden className="animate-caret ml-1 inline-block h-3.5 w-2 translate-y-0.5 bg-[var(--color-accent)]" />
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div role="alert" className={cn(panel, 'flex h-full flex-col overflow-hidden border-[var(--color-error)]/50', className)}>
        <div className="flex items-center gap-2 border-b-2 border-[var(--color-border)] px-4 py-2.5 font-pixel text-sm text-[var(--color-error)]">
          <PixelSprite sprite="bug" scale={1.5} /> Your code couldn't run
        </div>
        <pre className="pixel-scroll flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs text-[var(--color-text-primary)]">{error ?? 'Something went wrong while running your code.'}</pre>
        <Console stdout={stdout} />
      </div>
    )
  }

  if (!testResults || testResults.length === 0) {
    return (
      <div
        className={cn(panel, 'flex h-full flex-col items-center justify-center gap-2 border-dashed border-[var(--color-border-strong)] p-6 text-center', className)}
      >
        <PixelSprite sprite="terminal" scale={3} />
        <p className="font-pixel text-sm text-[var(--color-text-primary)]">Awaiting your first run</p>
        <p className="text-sm text-[var(--color-text-secondary)]">Hit Run to send your code into battle. Test results will show up here.</p>
      </div>
    )
  }

  const passedCount = testResults.filter((t) => t.passed).length
  const allPassed = passedCount === testResults.length

  return (
    <div className={cn(panel, 'flex h-full flex-col overflow-hidden border-[var(--color-border)]', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[var(--color-border)] px-4 py-2.5">
        <p className="flex items-center gap-2 font-pixel text-sm">
          Test Cases
          <span
            className={cn(
              'border-2 px-1.5 leading-5',
              allPassed
                ? 'border-[var(--color-success)]/40 bg-[var(--color-success)]/15 text-[var(--color-success)]'
                : 'border-[var(--color-error)]/40 bg-[var(--color-error)]/15 text-[var(--color-error)]',
            )}
          >
            {passedCount}/{testResults.length}
          </span>
        </p>
        {(runtimeMs != null || memoryMb != null) && (
          <div className="flex items-center gap-2 font-pixel text-xs text-[var(--color-text-secondary)]">
            {runtimeMs != null && (
              <span className="flex items-center gap-1 border-2 border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-1.5 py-0.5">
                <PixelSprite sprite="lightning" scale={1} />
                {runtimeMs}ms
              </span>
            )}
            {memoryMb != null && (
              <span className="flex items-center gap-1 border-2 border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-1.5 py-0.5">
                <PixelSprite sprite="floppy" scale={1} />
                {memoryMb}MB
              </span>
            )}
          </div>
        )}
      </div>

      <div className="pixel-scroll flex-1 space-y-2 overflow-y-auto p-3">
        {testResults.map((result, i) => (
          <div
            key={result.id}
            className={cn(
              'border-2 p-3 text-xs',
              result.passed
                ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/5'
                : 'border-[var(--color-error)]/35 bg-[var(--color-error)]/5',
            )}
          >
            <div className="flex items-center gap-2 font-pixel text-sm">
              <PixelSprite sprite={result.passed ? 'star' : 'bug'} scale={1.5} />
              <span>Test Case {i + 1}</span>
              <span
                className={cn(
                  'ml-auto text-xs uppercase tracking-wider',
                  result.passed ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]',
                )}
              >
                {result.passed ? 'Cleared' : 'Bug found'}
              </span>
            </div>
            <div className="mt-2 grid gap-1.5 font-mono text-[var(--color-text-secondary)]">
              <p>
                <span className="text-[var(--color-text-muted)]">Input: </span>
                {result.input}
              </p>
              <p>
                <span className="text-[var(--color-text-muted)]">Expected: </span>
                {result.expectedOutput}
              </p>
              <p className={cn(!result.passed && 'text-[var(--color-error)]')}>
                <span className="text-[var(--color-text-muted)]">Received: </span>
                {result.receivedOutput}
              </p>
              {result.error && (
                <p className="text-[var(--color-error)]">
                  <span className="text-[var(--color-text-muted)]">Error: </span>
                  {result.error}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <Console stdout={stdout} />
    </div>
  )
}
