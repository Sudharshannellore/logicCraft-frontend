import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Editor, { type OnMount } from '@monaco-editor/react'
import { ArrowLeft, CheckCircle2, ExternalLink, Play, RotateCcw, Send, XCircle } from 'lucide-react'
import type { LibraryExerciseDetail, LibraryRunResult } from '@/types'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { playSound } from '@/services/sound'
import { useWalletStore } from '@/stores/walletStore'
import { Badge, difficultyVariant } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Markdown } from '@/components/ui/Markdown'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { VictoryOverlay } from '@/components/gamification/VictoryOverlay'
import { defineTheme } from '@/components/coding/CodeEditor'
import { cn } from '@/utils/cn'

/** Monaco language ids by file extension. */
const MONACO: Record<string, string> = {
  py: 'python', js: 'javascript', mjs: 'javascript', ts: 'typescript', sql: 'sql', java: 'java', cs: 'csharp',
  cpp: 'cpp', hpp: 'cpp', h: 'c', c: 'c', php: 'php', go: 'go', rs: 'rust', kt: 'kotlin', swift: 'swift', toml: 'ini', json: 'json',
} // prettier-ignore

const monacoFor = (file: string) => MONACO[file.split('.').pop() ?? ''] ?? 'plaintext'

const EDITOR_OPTIONS = {
  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
  fontSize: 14,
  lineHeight: 22,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 14, bottom: 14 },
  tabSize: 4,
  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, useShadows: false },
  overviewRulerBorder: false,
} as const

function FileTabs({ files, value, onChange }: { files: string[]; value: string; onChange: (f: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Files">
      {files.map((file) => (
        <button
          key={file}
          type="button"
          role="tab"
          aria-selected={file === value}
          onClick={() => onChange(file)}
          className={cn(
            'whitespace-nowrap px-2.5 py-1 font-mono text-xs',
            file === value ? 'bg-[var(--color-accent)] text-[#06120a]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]',
          )}
        >
          {file}
        </button>
      ))}
    </div>
  )
}

function Results({ result, running }: { result: LibraryRunResult | null; running: boolean }) {
  if (running) {
    return (
      <div role="status" className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <PixelSprite sprite="heroRun" scale={3} fps={8} />
        <p className="font-pixel text-sm uppercase tracking-widest text-[var(--color-accent)]">Running the tests…</p>
      </div>
    )
  }
  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <PixelSprite sprite="terminal" scale={3} />
        <p className="font-pixel text-sm">Awaiting your first run</p>
        <p className="text-sm text-[var(--color-text-secondary)]">Run the tests to see how your solution does. Ctrl+Enter works too.</p>
      </div>
    )
  }
  return (
    <div className="pixel-scroll h-full overflow-y-auto p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2 font-pixel text-sm">
        <span
          className={cn(
            'border-2 px-2 py-0.5',
            result.status === 'passed'
              ? 'border-[var(--color-success)]/50 bg-[var(--color-success)]/15 text-[var(--color-success)]'
              : 'border-[var(--color-error)]/50 bg-[var(--color-error)]/15 text-[var(--color-error)]',
          )}
        >
          {result.passedCount}/{result.total} tests passed
        </span>
        {result.runtimeMs != null && <span className="text-xs text-[var(--color-text-muted)]">{result.runtimeMs} ms</span>}
      </div>
      {result.error && (
        <pre role="alert" className="mb-3 whitespace-pre-wrap border-2 border-[var(--color-error)]/40 bg-[var(--color-error)]/10 p-3 font-mono text-xs text-[var(--color-text-primary)]">
          {result.error}
        </pre>
      )}
      <ul className="space-y-1.5">
        {result.tests.map((test, i) => (
          <li
            key={`${test.name}-${i}`}
            className={cn(
              'border-2 px-3 py-2 text-xs',
              test.status === 'pass' ? 'border-[var(--color-success)]/25 bg-[var(--color-success)]/5' : 'border-[var(--color-error)]/35 bg-[var(--color-error)]/5',
            )}
          >
            <p className="flex items-start gap-2 text-sm">
              {test.status === 'pass' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-error)]" />
              )}
              <span className="text-[var(--color-text-primary)]">{test.name}</span>
            </p>
            {test.message && <pre className="mt-1.5 whitespace-pre-wrap pl-6 font-mono text-[var(--color-text-secondary)]">{test.message}</pre>}
          </li>
        ))}
      </ul>
      {result.stdout.trim() && (
        <div className="mt-3">
          <p className="mb-1 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Your output</p>
          <pre className="whitespace-pre-wrap border-2 border-[var(--color-border)] bg-[var(--color-bg)] p-2 font-mono text-xs text-[var(--color-text-secondary)]">
            {result.stdout}
          </pre>
        </div>
      )}
    </div>
  )
}

interface ExerciseWorkspaceProps {
  exercise: LibraryExerciseDetail
  backHref: string
  backLabel: string
  /**
   * Grades a submission instead of the practice library's submit (e.g. as a challenge stage). The caller
   * handles XP and celebrations; the workspace just shows the test results.
   */
  onSubmit?: (files: Record<string, string>) => Promise<LibraryRunResult>
  /** Extra header content, e.g. a challenge clock. */
  headerExtra?: ReactNode
  /** Locks the editor and buttons, e.g. when a challenge clock has run out. */
  disabled?: boolean
}

/** Instructions, tests, a Monaco editor and test results for one Exercism exercise. */
export function ExerciseWorkspace({ exercise, backHref, backLabel, onSubmit, headerExtra, disabled = false }: ExerciseWorkspaceProps) {
  const queryClient = useQueryClient()
  const setBalance = useWalletStore((s) => s.setBalance)
  const storageKey = `logicraft-exercise:${exercise.language.id}/${exercise.slug}`
  const solutionFiles = Object.keys(exercise.solution)
  const [files, setFiles] = useState<Record<string, string>>(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) return { ...exercise.solution, ...(JSON.parse(saved) as Record<string, string>) }
    } catch {
      // No saved draft — start from the starter code.
    }
    return exercise.solution
  })
  const [active, setActive] = useState(solutionFiles[0])
  const [leftTab, setLeftTab] = useState<'instructions' | 'tests'>('instructions')
  const [testFile, setTestFile] = useState(Object.keys(exercise.tests)[0])
  const [result, setResult] = useState<LibraryRunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [victory, setVictory] = useState<number | null>(null)
  const gradable = exercise.language.gradable
  const canRun = gradable && !disabled

  // Drafts survive a reload (per browser) — handy for longer exercises.
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(files))
    } catch {
      // Storage full or unavailable: drafts just aren't kept.
    }
  }, [files, storageKey])

  const run = async (submit: boolean) => {
    if (running || !canRun) return
    playSound(submit ? 'submit' : 'run')
    setRunning(true)
    setError(null)
    try {
      if (submit && onSubmit) {
        // The caller celebrates a passing submit (round cleared, boss defeated).
        const graded = await onSubmit(files)
        setResult(graded)
        if (graded.status !== 'passed') playSound('fail')
        return
      }
      const response = submit
        ? await api.submitLibraryExercise(exercise.language.id, exercise.slug, files)
        : await api.runLibraryExercise(exercise.language.id, exercise.slug, files)
      setResult(response)
      setBalance(response.balance)
      if (response.status !== 'passed') playSound('fail')
      else if (!submit) playSound('success')
      if (submit && response.status === 'passed') {
        setVictory(response.awardedXp ?? 0)
        void queryClient.invalidateQueries({ queryKey: ['library'] })
        void queryClient.invalidateQueries({ queryKey: ['daily-quest'] })
        queryClient.setQueryData(['library-exercise', exercise.language.id, exercise.slug], { ...exercise, solved: true })
      }
    } catch (e) {
      setError(errorMessage(e))
      playSound('error')
    } finally {
      setRunning(false)
    }
  }

  // Monaco commands are registered once, so they call through a ref to stay current.
  const runRef = useRef(run)
  useEffect(() => {
    runRef.current = run
  })
  const handleMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => void runRef.current(false))
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => void runRef.current(true))
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b-2 border-[var(--pixel-ink)] bg-[var(--color-surface)] px-4 py-2.5">
        <Link
          to={backHref}
          aria-label={backLabel}
          className="flex h-9 w-9 items-center justify-center border-2 border-[var(--color-border-strong)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-pixel text-lg">{exercise.name}</h1>
          <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <span>{exercise.language.name}</span>
            <Badge variant={difficultyVariant(exercise.difficulty)} className="capitalize">
              {exercise.difficulty}
            </Badge>
            <span>Level {exercise.level}/10</span>
            {gradable && <span className="text-[var(--color-warning)]">+{exercise.xp} XP</span>}
            {exercise.solved && <Badge variant="success">Solved</Badge>}
          </p>
        </div>
        {headerExtra}
        <a href={exercise.exercismUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: gradable ? 'ghost' : 'pixel', size: 'sm' })}>
          <ExternalLink className="h-3.5 w-3.5" /> {gradable ? 'Exercism' : 'Solve on Exercism'}
        </a>
        {gradable && (
          <>
            <Button variant="pixelDark" size="sm" onClick={() => void run(false)} disabled={running || !canRun} data-sound="none">
              <Play className="h-3.5 w-3.5" /> Run tests
            </Button>
            <Button variant="pixel" size="sm" onClick={() => void run(true)} disabled={running || !canRun} data-sound="none">
              <Send className="h-3.5 w-3.5" /> Submit
            </Button>
          </>
        )}
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Left: instructions and tests */}
        <section className="flex min-h-0 flex-col border-r-2 border-[var(--pixel-ink)] bg-[var(--color-surface)]">
          <div className="flex gap-1 border-b-2 border-[var(--color-border)] px-3 pt-2" role="tablist" aria-label="Exercise">
            {(['instructions', 'tests'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={leftTab === tab}
                onClick={() => setLeftTab(tab)}
                className={cn(
                  '-mb-0.5 border-b-2 px-3 py-1.5 font-pixel text-sm capitalize',
                  leftTab === tab ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-text-secondary)]',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          {leftTab === 'instructions' ? (
            <div className="pixel-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[15px] leading-7 text-[var(--color-text-secondary)]">
              <Markdown text={exercise.instructions || exercise.blurb} />
              <p className="mt-6 border-t-2 border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-muted)]">
                Exercise from{' '}
                <a href={exercise.exercismUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">
                  Exercism
                </a>{' '}
                (MIT licence).
                {exercise.source && (
                  <>
                    {' '}
                    Source:{' '}
                    {exercise.sourceUrl ? (
                      <a href={exercise.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {exercise.source}
                      </a>
                    ) : (
                      exercise.source
                    )}
                    .
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              {Object.keys(exercise.tests).length > 1 && (
                <div className="border-b-2 border-[var(--color-border)] px-3 py-1.5">
                  <FileTabs files={Object.keys(exercise.tests)} value={testFile} onChange={setTestFile} />
                </div>
              )}
              <p className="px-4 py-2 text-xs text-[var(--color-text-muted)]">
                {gradable ? 'Your solution must pass these tests.' : 'These are the tests Exercism runs on your solution.'} Read-only.
              </p>
              <div className="min-h-0 flex-1">
                <Editor
                  height="100%"
                  theme="logicraft-dark"
                  beforeMount={defineTheme}
                  path={`tests/${testFile}`}
                  language={monacoFor(testFile)}
                  value={exercise.tests[testFile]}
                  options={{ ...EDITOR_OPTIONS, readOnly: true, domReadOnly: true }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Right: editor and results */}
        <section className="grid min-h-0 grid-rows-[minmax(0,3fr)_minmax(0,2fr)] bg-[#0d0f14]">
          <div className="flex min-h-0 flex-col">
            <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b-2 border-[var(--pixel-ink)] bg-[var(--color-surface)] px-2">
              <FileTabs files={solutionFiles} value={active} onChange={setActive} />
              {gradable && (
                <Button
                  variant="ghost"
                  size="sm"
                  title="Reset this file to the starter code"
                  onClick={() => setFiles((f) => ({ ...f, [active]: exercise.solution[active] }))}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              )}
            </div>
            <div className="min-h-0 flex-1">
              <Editor
                height="100%"
                theme="logicraft-dark"
                beforeMount={defineTheme}
                onMount={handleMount}
                path={`solution/${active}`}
                language={monacoFor(active)}
                value={files[active]}
                onChange={(next) => setFiles((f) => ({ ...f, [active]: next ?? '' }))}
                options={{ ...EDITOR_OPTIONS, readOnly: !canRun }}
              />
            </div>
          </div>
          <div className="min-h-0 border-t-2 border-[var(--pixel-ink)] bg-[var(--color-surface)]">
            {gradable ? (
              <>
                {error && (
                  <p role="alert" className="border-b-2 border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-3 py-2 text-sm">
                    {error}
                  </p>
                )}
                <Results result={result} running={running} />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <PixelSprite sprite="compass" scale={4} className="animate-pixel-hover" />
                <p className="max-w-md text-sm text-[var(--color-text-secondary)]">
                  {exercise.language.name} tests don't run on this server yet. Exercism's free online editor runs these exact tests — open the exercise there to solve it.
                </p>
                <a href={exercise.exercismUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'pixel' })}>
                  <ExternalLink className="h-4 w-4" /> Solve on Exercism
                </a>
              </div>
            )}
          </div>
        </section>
      </div>

      <VictoryOverlay
        open={victory !== null}
        xp={exercise.xp}
        awardedXp={victory ?? 0}
        onClose={() => setVictory(null)}
      />
    </div>
  )
}
