import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, RotateCcw } from 'lucide-react'
import type { Lesson } from '@/types'
import { Button, buttonVariants } from '@/components/ui/Button'
import { RichText } from '@/components/ui/RichText'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { HashTableDiagram } from './HashTableDiagram'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { languageMeta } from './languages'
import { cn } from '@/utils/cn'

export function StepConcept({ lesson }: { lesson: Lesson }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
      <div className="space-y-7">
        <p className="text-lg leading-8 text-[var(--color-text-primary)] lg:text-xl lg:leading-9">{lesson.explanation}</p>

        {lesson.keyPoints && (
          <div>
            <p className="mb-3 font-pixel text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Key takeaways</p>
            <ol className="space-y-3">
              {lesson.keyPoints.map((point, i) => (
                <li key={point} className="flex items-start gap-3 border-2 border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--color-accent)] font-pixel text-sm text-[#06120a]">{i + 1}</span>
                  <span className="pt-0.5 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">{point}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {lesson.analogy && (
        <aside className="flex flex-col items-center gap-5 self-start border-2 border-[var(--color-violet)]/40 bg-[var(--color-violet-soft)] p-6 text-center shadow-[4px_4px_0_var(--pixel-ink)]">
          <PixelSprite sprite="compass" scale={6} className="animate-pixel-hover" />
          <div>
            <p className="mb-2 font-pixel text-sm uppercase tracking-wider text-[var(--color-violet)]">In real life</p>
            <p className="text-[15px] leading-relaxed text-[var(--color-text-primary)]">{lesson.analogy}</p>
          </div>
        </aside>
      )}
    </div>
  )
}

const visualSteps = ['A key goes in', 'hash() turns it into a bucket number', 'The value is stored in that bucket']

export function StepVisualize() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-10">
      <HashTableDiagram />
      <div>
        <p className="mb-3 font-pixel text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">How it works</p>
        <ol className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          {visualSteps.map((text, i) => (
            <li key={text} className="flex items-center gap-3 border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
              <span className="font-pixel text-2xl text-[var(--color-accent)]">{i + 1}</span>
              <span className="text-sm text-[var(--color-text-secondary)]">{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export function StepCode({ lesson, language = 'python' }: { lesson: Lesson; language?: string }) {
  const lines = lesson.codeExample.split('\n')
  const lang = languageMeta(language)
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
      <div className="self-start overflow-hidden border-2 border-[var(--color-border-strong)]">
        <div className="flex items-center justify-between border-b-2 border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-4 py-2">
          <span className="font-pixel text-xs text-[var(--color-text-muted)]">{`example.${lang.ext}`}</span>
          <span className="font-pixel text-xs text-[var(--color-accent)]">{lang.label}</span>
        </div>
        <pre className="pixel-scroll overflow-x-auto bg-[#0d0f14] py-3 font-mono [tab-size:4] text-[14px] leading-7">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="w-12 shrink-0 select-none pr-4 text-right text-[#3a404c]">{i + 1}</span>
              <code className="whitespace-pre text-[var(--color-text-primary)]">{line || ' '}</code>
            </div>
          ))}
        </pre>
      </div>

      {lesson.codeWalkthrough && (
        <div>
          <p className="mb-3 font-pixel text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">What's happening</p>
          <ul className="space-y-2.5">
            {lesson.codeWalkthrough.map((note) => (
              <li key={note} className="flex gap-3 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
                <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 bg-[var(--color-accent)]" />
                <span>
                  <RichText text={note} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

type RunState = { status: 'idle' } | { status: 'checking' } | { status: 'pass'; output: string } | { status: 'fail'; hint: string }

export function StepTryIt({ lesson, language = 'python', onPassed }: { lesson: Lesson; language?: string; onPassed: () => void }) {
  const tryIt = lesson.tryIt!
  const [code, setCode] = useState(tryIt.starterCode)
  const [run, setRun] = useState<RunState>({ status: 'idle' })

  const runCode = async () => {
    setRun({ status: 'checking' })
    try {
      const result = await api.checkTryIt(lesson.id, code)
      if (result.passed) {
        setRun({ status: 'pass', output: result.expectedOutput })
        onPassed()
      } else {
        setRun({ status: 'fail', hint: result.hints[0] ?? 'Not quite — re-read the task and try again.' })
      }
    } catch (e) {
      setRun({ status: 'fail', hint: errorMessage(e) })
    }
  }

  const taskCard = (
    <div className="flex gap-3 border-l-4 border-[var(--color-warning)] bg-[var(--color-warning)]/10 p-4">
      <PixelSprite sprite="sword" scale={2} className="shrink-0" />
      <p className="text-[15px] leading-relaxed text-[var(--color-text-primary)]">
        <span className="font-pixel text-[var(--color-warning)]">Your task: </span>
        {tryIt.prompt}
      </p>
    </div>
  )

  const output = (
    <div
      role="status"
      className={cn(
        'border-2 px-4 py-3 font-mono text-sm',
        run.status === 'pass' && 'border-[var(--color-success)]/40 bg-[var(--color-success)]/10',
        run.status === 'fail' && 'border-[var(--color-error)]/40 bg-[var(--color-error)]/10',
        (run.status === 'idle' || run.status === 'checking') && 'border-[var(--color-border-strong)] bg-[var(--color-bg)] text-[var(--color-text-muted)]',
      )}
    >
      <p className="mb-2 font-pixel text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Output</p>
      {run.status === 'idle' && <span>&gt; Run your code to see the result here.</span>}
      {run.status === 'checking' && <span>&gt; Checking your code…</span>}
      {run.status === 'pass' && (
        <div className="flex items-start gap-3">
          <PixelSprite sprite="star" scale={2} fps={3} className="shrink-0" />
          <div>
            <p className="text-[var(--color-text-primary)]">&gt; {run.output}</p>
            <p className="mt-1 font-sans text-[var(--color-success)]">Nailed it — that's exactly what this task asked for.</p>
          </div>
        </div>
      )}
      {run.status === 'fail' && (
        <div className="flex items-start gap-3">
          <PixelSprite sprite="bug" scale={2} className="shrink-0" />
          <p className="font-sans text-[var(--color-text-primary)]">
            <span className="font-pixel text-[var(--color-error)]">Not yet. </span>
            {run.hint}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-8">
      <div className="lg:hidden">{taskCard}</div>

      <div className="self-start overflow-hidden border-2 border-[var(--color-border-strong)]">
        <div className="flex items-center justify-between border-b-2 border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-3 py-1.5">
          <span className="font-pixel text-xs text-[var(--color-text-muted)]">{`try_it.${languageMeta(language).ext}`}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCode(tryIt.starterCode)
                setRun({ status: 'idle' })
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
            <Button size="sm" onClick={runCode} disabled={run.status === 'checking'}>
              <Play className="h-3.5 w-3.5" /> {run.status === 'checking' ? 'Checking…' : 'Run'}
            </Button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          rows={8}
          aria-label="Your code"
          className="pixel-scroll block w-full resize-y bg-[#0d0f14] p-4 font-mono text-[14px] leading-7 text-[var(--color-text-primary)] outline-none focus:shadow-[inset_0_0_0_2px_var(--color-accent)]"
        />
      </div>

      <div className="space-y-4 self-start">
        <div className="hidden lg:block">{taskCard}</div>
        {output}
      </div>
    </div>
  )
}

/** `awardedXp` is what this completion actually paid; 0 means the lesson's XP was earned on an earlier run. */
export function StepComplete({ lesson, courseId, awardedXp }: { lesson: Lesson; courseId: string; awardedXp: number }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex items-end gap-6">
        <PixelSprite sprite="hero" scale={6} className="animate-pixel-bob" />
        <PixelSprite sprite="chestOpened" scale={6} />
      </div>
      <div className="h-2 w-64 bg-[var(--color-accent)]" />
      <h2 className="mt-6 font-pixel text-4xl text-[var(--color-accent)] [text-shadow:3px_3px_0_var(--color-violet-strong)]">Lesson complete!</h2>
      <p className="mt-2 max-w-md text-[var(--color-text-secondary)]">
        You've learned <span className="text-[var(--color-text-primary)]">{lesson.concept}</span>. Lock it in by using it on a real problem.
      </p>
      {awardedXp > 0 ? (
        <p className="mt-4 flex items-center gap-2 font-pixel text-2xl text-[var(--color-warning)]">
          <PixelSprite sprite="star" scale={2.5} fps={2} />+{awardedXp} XP added to your balance
        </p>
      ) : (
        <p className="mt-4 font-pixel text-sm text-[var(--color-text-muted)]">You already earned this lesson's XP — nice refresher!</p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/practice/two-sum" className={cn(buttonVariants({ variant: 'pixel', size: 'lg' }), 'text-lg')}>
          Practice this concept
        </Link>
        <Link to={`/learn/${courseId}`} className={buttonVariants({ variant: 'pixelDark', size: 'lg' })}>
          Back to course
        </Link>
      </div>
    </div>
  )
}
