import { useMemo, useState } from 'react'
import { Play, RotateCcw, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import type { SpriteName } from '@/components/pixel/sprites'
import { QuestAIAvatar } from '@/components/illustrations/QuestAIAvatar'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { useWalletStore } from '@/stores/walletStore'
import type { SqlGrade as GradeResult, SqlProblem, SqlQueryResult as QueryResult, SqlTable } from '@/types'
import { cn } from '@/utils/cn'

const SANDBOX_QUERY = `SELECT department, AVG(salary) FROM employees GROUP BY department;`

interface SqlBoardProps {
  tables: SqlTable[]
  /** When set, the board becomes a graded question board. */
  problem?: SqlProblem
  /** A Submit passed; `awardedXp` is 0 when this question was already solved before. */
  onSolved?: (awardedXp: number) => void
}

function StatTile({ sprite, label, value, color }: { sprite: SpriteName; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 border-2 border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-3 py-2 shadow-[3px_3px_0_var(--pixel-ink)]">
      <PixelSprite sprite={sprite} scale={2} />
      <div className="min-w-0 flex-1">
        <p className="font-pixel text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
        <p className="font-pixel text-lg leading-tight" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  )
}

function CoachBubble({ tone = 'violet', children }: { tone?: 'violet' | 'success' | 'error'; children: React.ReactNode }) {
  const tones = {
    violet: 'border-[var(--color-violet)]/30 bg-[var(--color-violet-soft)]',
    success: 'border-[var(--color-success)]/40 bg-[var(--color-success)]/10',
    error: 'border-[var(--color-error)]/40 bg-[var(--color-error)]/10',
  }
  return <div className={cn('border-2 p-3 text-sm shadow-[3px_3px_0_var(--pixel-ink)]', tones[tone])}>{children}</div>
}

export function SqlBoard({ tables, problem, onSolved }: SqlBoardProps) {
  const initialQuery = problem?.starterQuery ?? SANDBOX_QUERY
  const [selectedTable, setSelectedTable] = useState<string | null>(problem?.tablesUsed[0] ?? null)
  const [query, setQuery] = useState(initialQuery)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [hasRun, setHasRun] = useState(false)
  const [verdict, setVerdict] = useState<GradeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeTable = useMemo(() => tables.find((t) => t.name === selectedTable) ?? tables[0], [tables, selectedTable])

  async function execute(submit: boolean) {
    setIsRunning(true)
    setHasRun(false)
    setVerdict(null)
    setError(null)
    try {
      const response = problem
        ? await (submit ? api.submitSqlProblem(problem.slug, query) : api.runSqlProblem(problem.slug, query))
        : await api.runSqlQuery(query)
      setResult(response.result)
      setError(response.error ?? null)
      useWalletStore.getState().setBalance(response.balance)
      if (submit && response.grade) {
        setVerdict(response.grade)
        if (response.grade.passed) onSolved?.(response.awardedXp ?? 0)
      }
    } catch (e) {
      setResult(null)
      setError(errorMessage(e))
    }
    setIsRunning(false)
    setHasRun(true)
  }

  function reset() {
    setQuery(initialQuery)
    setResult(null)
    setHasRun(false)
    setVerdict(null)
    setError(null)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr_300px]">
      {/* LEFT: Database explorer */}
      <Card className="lg:sticky lg:top-[calc(var(--topbar-h,4rem)_+_1rem)] lg:self-start">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <PixelSprite sprite="treasureMap" scale={2} />
            Database Explorer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {tables.map((table) => {
            const isActive = activeTable?.name === table.name
            const isUsed = problem?.tablesUsed.includes(table.name)
            return (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table.name)}
                aria-pressed={isActive}
                className={cn(
                  'flex w-full items-center gap-2 border-2 px-2 py-1.5 text-left font-mono text-sm transition-colors',
                  isActive
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] shadow-[2px_2px_0_var(--pixel-ink)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-elevated)]',
                )}
              >
                <span className={cn('w-3 font-pixel text-xs', !isActive && 'invisible')} aria-hidden="true">
                  ▶
                </span>
                <PixelSprite sprite={isActive ? 'database' : 'floppy'} scale={2} />
                <span className="flex-1 truncate">{table.name}</span>
                {isUsed ? (
                  <span className="bg-[var(--color-warning)] px-1 font-pixel text-[9px] text-[#1a1200]">USED</span>
                ) : (
                  <span className="font-pixel text-[10px] text-[var(--color-text-muted)]">{table.rows.length} rows</span>
                )}
              </button>
            )
          })}

          {activeTable && (
            <div className="mt-4 border-t-2 border-[var(--color-border)] pt-4">
              <p className="mb-2 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Columns</p>
              <ul className="mb-4 space-y-1 font-mono text-xs">
                {activeTable.columns.map((col) => (
                  <li key={col.name} className="flex items-center justify-between">
                    <span className="text-[var(--color-text-primary)]">{col.name}</span>
                    <span className="text-[var(--color-text-muted)]">{col.type}</span>
                  </li>
                ))}
              </ul>
              <p className="mb-2 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Sample rows</p>
              <div className="pixel-scroll overflow-x-auto border-2 border-[var(--color-border)]">
                <table className="w-full font-mono text-[10px]">
                  <tbody>
                    {activeTable.rows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="whitespace-nowrap px-2 py-1 text-[var(--color-text-secondary)]">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CENTER: Editor + Results */}
      <div className="min-w-0 space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="flex-wrap">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PixelSprite sprite="terminal" scale={2} />
              Query Editor
            </CardTitle>
            <div className="flex items-center gap-2">
              {problem && (
                <Button size="sm" variant="ghost" onClick={reset} disabled={isRunning}>
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              )}
              <Button size="sm" variant={problem ? 'secondary' : 'primary'} onClick={() => execute(false)} disabled={isRunning}>
                <Play className="h-3.5 w-3.5" />
                {isRunning ? 'Running…' : problem ? 'Run' : 'Run Query'}
              </Button>
              {problem && (
                <Button size="sm" onClick={() => execute(true)} disabled={isRunning}>
                  <Send className="h-3.5 w-3.5" /> Submit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck={false}
              rows={7}
              aria-label="SQL query"
              className="w-full resize-y border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] p-4 font-mono text-sm text-[var(--color-accent)] outline-none focus:border-[var(--color-accent)]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Results</CardTitle>
            <div className="flex items-center gap-2">
              {verdict && <Badge variant={verdict.passed ? 'success' : 'error'}>{verdict.passed ? 'Accepted' : 'Not yet'}</Badge>}
              {result && hasRun && <Badge variant="accent">{result.rows.length} rows</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {problem && !hasRun && !isRunning && (
              <p className="mb-4 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Expected columns: <span className="font-mono normal-case text-[var(--color-accent)]">{problem.expectedColumns.join(', ')}</span>
              </p>
            )}
            {isRunning && (
              <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
                <PixelSprite sprite="heroRun" scale={4} fps={8} />
                <div className="h-1 w-24 bg-[var(--color-accent)]" />
                <p className="font-pixel text-lg tracking-widest text-[var(--color-accent)]">
                  QUERYING<span className="animate-caret">_</span>
                </p>
              </div>
            )}
            {!isRunning && !hasRun && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <PixelSprite sprite="chest" scale={4} className="animate-pixel-bob" />
                <p className="font-pixel text-base text-[var(--color-text-primary)]">Loot awaits</p>
                <p className="max-w-xs text-sm text-[var(--color-text-secondary)]">
                  {problem ? (
                    <>
                      <span className="font-pixel text-[var(--color-accent)]">Run</span> to preview rows,{' '}
                      <span className="font-pixel text-[var(--color-accent)]">Submit</span> to claim the XP.
                    </>
                  ) : (
                    <>
                      Hit <span className="font-pixel text-[var(--color-accent)]">Run Query</span> to open the chest and see what rows
                      come back.
                    </>
                  )}
                </p>
              </div>
            )}
            {!isRunning && hasRun && !result && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <PixelSprite sprite="bugSlime" scale={3} fps={3} />
                <p className="font-pixel text-base text-[var(--color-error)]">Query error</p>
                <p className="max-w-md font-mono text-sm text-[var(--color-text-secondary)]">{error ?? 'The query returned nothing.'}</p>
                <p className="max-w-sm text-xs text-[var(--color-text-muted)]">
                  Tables you can query:{' '}
                  {tables.map((t, i) => (
                    <span key={t.name}>
                      <span className="font-mono text-[var(--color-accent)]">{t.name}</span>
                      {i < tables.length - 1 ? ', ' : '.'}
                    </span>
                  ))}
                </p>
              </div>
            )}
            {!isRunning && hasRun && result && (
              <div className="pixel-scroll overflow-x-auto border-2 border-[var(--color-border)]">
                <table className="w-full font-mono text-xs">
                  <thead>
                    <tr className="border-b-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
                      {result.columns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left text-[var(--color-text-secondary)]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                        {result.columns.map((col) => (
                          <td key={col} className="px-3 py-2 text-[var(--color-text-primary)]">
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: AI SQL Coach */}
      <Card className="border-[var(--color-violet)]/30 lg:sticky lg:top-[calc(var(--topbar-h,4rem)_+_1rem)] lg:self-start">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <QuestAIAvatar size={24} animated={isRunning} />
            AI SQL Coach
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {verdict?.passed && problem ? (
            <CoachBubble tone="success">
              <p className="mb-1 font-pixel text-[var(--color-success)]">Accepted!</p>
              <p className="text-[var(--color-text-primary)]">{problem.successNote}</p>
            </CoachBubble>
          ) : verdict && !verdict.passed ? (
            <CoachBubble tone="error">
              <p className="mb-2 font-pixel text-[var(--color-error)]">Not quite yet</p>
              {verdict.message && <p className="mb-2 text-[var(--color-text-primary)]">{verdict.message}</p>}
              <ul className="space-y-1.5 text-[var(--color-text-primary)]">
                {verdict.missingHints.slice(0, 2).map((hint) => (
                  <li key={hint} className="flex gap-2">
                    <span className="font-pixel text-[var(--color-error)]">▶</span>
                    {hint}
                  </li>
                ))}
              </ul>
            </CoachBubble>
          ) : hasRun && result ? (
            <CoachBubble>
              <p className="text-[var(--color-text-primary)]">
                {problem
                  ? 'It runs! Compare the rows with the expected columns, then hit Submit when you think it’s right.'
                  : 'Your query works correctly. If it runs often on a large dataset, consider indexing the columns you filter or group by.'}
              </p>
            </CoachBubble>
          ) : (
            <CoachBubble>
              <p className="text-[var(--color-text-secondary)]">
                {problem ? `Tables you'll need: ${problem.tablesUsed.join(', ')}. Run a query and I'll review it.` : "Run a query and I'll review it for correctness and performance."}
              </p>
            </CoachBubble>
          )}
          {hasRun && result && (
            <div className="space-y-2.5">
              <StatTile sprite="lightning" label="Execution time" value={`${result.executionMs}ms`} color="var(--color-warning)" />
              <StatTile sprite="scroll" label="Rows returned" value={String(result.rows.length)} color="var(--color-info)" />
              <StatTile
                sprite={verdict && !verdict.passed ? 'bug' : 'star'}
                label={problem ? 'Verdict' : 'Query efficiency'}
                value={problem ? (verdict ? (verdict.passed ? 'PASSED' : 'RETRY') : 'UNGRADED') : 'GOOD'}
                color={verdict && !verdict.passed ? 'var(--color-error)' : 'var(--color-success)'}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
