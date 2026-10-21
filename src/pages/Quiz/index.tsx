import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Clock, X } from 'lucide-react'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import type { FrameworkQuiz, QuizQuestion, QuizResult } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { PageLoader } from '@/components/layout/PageLoader'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { isSpriteName } from '@/components/pixel/sprites'
import { useWalletStore } from '@/stores/walletStore'
import { cn } from '@/utils/cn'
import { formatCountdown, useNow } from '@/pages/Challenges/utils'

const KIND_LABEL = { practice: 'Practice quiz', daily: 'Daily quiz', zone: 'Zone boss' } as const

function backLink(quiz: FrameworkQuiz) {
  if (quiz.kind === 'practice') return { to: `/practice?mode=frameworks&fw=${quiz.courseId}`, label: 'Practice' }
  if (quiz.kind === 'daily') return { to: `/challenges?mode=frameworks&fw=${quiz.courseId}`, label: 'Challenges' }
  return { to: `/learn/${quiz.courseId}`, label: quiz.courseTitle }
}

function Question({ index, question, picked, onPick, disabled }: { index: number; question: QuizQuestion; picked?: number; onPick: (i: number) => void; disabled: boolean }) {
  return (
    <fieldset className="border-2 border-[var(--color-border)] bg-[var(--color-bg)] p-4">
      <legend className="px-1 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Question {index + 1}</legend>
      <p className="mb-3 text-base leading-7 text-[var(--color-text-primary)]">{question.prompt}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {question.options.map((option, i) => (
          <label
            key={i}
            className={cn(
              'flex cursor-pointer items-center gap-3 border-2 px-3 py-2 text-sm transition-colors',
              picked === i
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]'
                : 'border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/60',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <input type="radio" name={question.id} checked={picked === i} disabled={disabled} onChange={() => onPick(i)} className="accent-[var(--color-accent)]" />
            <span className="min-w-0 break-words font-mono text-[13px]">{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Results({ result, questions, quiz }: { result: QuizResult; questions: QuizQuestion[]; quiz: FrameworkQuiz }) {
  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions])
  return (
    <div className="space-y-5">
      <Card className={cn('border-2', result.passed ? 'border-[var(--color-success)]' : 'border-[var(--color-error)]')}>
        <CardContent className="flex flex-wrap items-center gap-4">
          <PixelSprite sprite={result.passed ? 'trophy' : 'bugSlime'} scale={4} fps={result.passed ? 0 : 3} />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold">{result.passed ? 'Passed!' : 'Not yet'}</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {result.correct} of {result.total} correct ({result.percent}%). You need {quiz.passPercent}% to pass.
            </p>
            {result.awardedXp > 0 && <p className="mt-1 font-pixel text-[var(--color-warning)]">+{result.awardedXp} XP</p>}
            {quiz.kind === 'zone' && result.passed && <p className="mt-1 text-sm text-[var(--color-success)]">{quiz.bossName} is defeated. The next zone is open.</p>}
          </div>
        </CardContent>
      </Card>

      <ol className="space-y-3">
        {result.results.map((r, i) => {
          const question = byId.get(r.questionId)
          if (!question) return null
          return (
            <li key={r.questionId} className={cn('border-2 p-4', r.correct ? 'border-[var(--color-success)]/50' : 'border-[var(--color-error)]/50')}>
              <p className="flex items-start gap-2 text-sm">
                {r.correct ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-error)]" />}
                <span>
                  <span className="font-pixel text-xs text-[var(--color-text-muted)]">{i + 1}. </span>
                  {r.explanation}
                </span>
              </p>
              {!r.correct && (
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                  {r.chosen != null && question.options[r.chosen] ? (
                    <>
                      You chose <span className="font-mono text-[var(--color-error)]">{question.options[r.chosen]}</span>. The answer is{' '}
                    </>
                  ) : (
                    <>You didn't answer. The answer is </>
                  )}
                  <span className="font-mono text-[var(--color-success)]">{question.options[r.correctIndex]}</span>.{' '}
                  <Link to={`/learn/${quiz.courseId}/${r.lessonId}`} className="text-[var(--color-accent)] underline-offset-4 hover:underline">
                    Review the lesson
                  </Link>
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default function QuizPage() {
  const { quizId = '' } = useParams<{ quizId: string }>()
  const queryClient = useQueryClient()
  const setBalance = useWalletStore((s) => s.setBalance)
  const now = useNow(1000)
  const { data: quiz, error, refetch } = useQuery({ queryKey: ['quiz', quizId], queryFn: () => api.getQuiz(quizId), enabled: Boolean(quizId) })
  const [picked, setPicked] = useState<Record<string, number>>({})
  const [outcome, setOutcome] = useState<{ result: QuizResult; questions: QuizQuestion[] } | null>(null)

  // A different run (or a retry) starts from a clean sheet.
  useEffect(() => {
    setPicked({})
  }, [quiz?.deadline, quiz?.tries])

  const refresh = (courseId: string) => {
    for (const key of [['quiz', quizId], ['frameworks'], ['courses'], ['paths'], ['path'], ['daily-quest'], ['course-path', courseId], ['course', courseId], ['framework-practice', courseId], ['framework-challenges', courseId]]) {
      void queryClient.invalidateQueries({ queryKey: key })
    }
  }

  const start = useMutation({
    mutationFn: () => api.startQuiz(quizId),
    onSuccess: (started) => {
      setOutcome(null)
      queryClient.setQueryData(['quiz', quizId], started)
    },
  })
  const submit = useMutation({
    mutationFn: (questions: QuizQuestion[]) =>
      api.submitQuiz(
        quizId,
        questions.filter((q) => picked[q.id] != null).map((q) => ({ questionId: q.id, optionIndex: picked[q.id] })),
      ),
    onSuccess: (result, questions) => {
      setBalance(result.balance)
      setOutcome({ result, questions })
      refresh(result.quiz.courseId)
    },
  })
  const claim = useMutation({
    mutationFn: () => api.claimQuiz(quizId),
    onSuccess: (done) => {
      setBalance(done.balance)
      if (quiz) refresh(quiz.courseId)
      void refetch()
    },
  })

  if (quiz === null || error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-xl">{error ? "Couldn't load this quiz" : 'Quiz not found'}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{error ? errorMessage(error) : 'It may have ended, or its lesson has moved.'}</p>
        <Link to="/practice?mode=frameworks" className={cn(buttonVariants({ variant: 'pixel' }), 'mt-6')}>
          Back to practice
        </Link>
      </div>
    )
  }
  if (!quiz) return <PageLoader />

  const back = backLink(quiz)
  const questions = quiz.questions ?? []
  const secondsLeft = quiz.deadline ? Math.max(0, Math.floor((quiz.deadline - now) / 1000)) : null
  const timeUp = quiz.status === 'in_progress' && secondsLeft === 0
  const answered = questions.filter((q) => picked[q.id] != null).length
  const live = quiz.status === 'in_progress' || quiz.kind === 'practice'
  const showOutcome = outcome && outcome.result.quiz.id === quiz.id
  const canStart = quiz.kind !== 'practice' && !quiz.locked && !quiz.defeated && quiz.available && (quiz.status === 'not_started' || ((quiz.status === 'failed' || quiz.status === 'timed_out') && quiz.retry))
  const boss = quiz.bossSprite && isSpriteName(quiz.bossSprite) ? quiz.bossSprite : 'slime'

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Link to={back.to} className="mb-4 inline-flex items-center gap-1.5 font-pixel text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
        <ArrowLeft className="h-4 w-4" /> {back.label}
      </Link>

      <header className="mb-6 flex items-start gap-4">
        {quiz.kind === 'zone' && <PixelSprite sprite={boss} scale={3} fps={3} />}
        <div className="min-w-0">
          <p className="font-pixel text-xs uppercase tracking-wider text-[var(--color-accent)]">
            {KIND_LABEL[quiz.kind]} · {quiz.courseTitle}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{quiz.kind === 'zone' && quiz.bossName ? quiz.bossName : quiz.title}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{quiz.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge>{quiz.questionCount} questions</Badge>
            <Badge>Pass at {quiz.passPercent}%</Badge>
            <Badge variant="accent">+{quiz.xp} XP</Badge>
            {quiz.timeLimitMinutes && (
              <Badge>
                <Clock className="h-3 w-3" /> {quiz.timeLimitMinutes} min
              </Badge>
            )}
            {quiz.bestPercent != null && <Badge variant="success">Best {quiz.bestPercent}%</Badge>}
            {quiz.status === 'passed' && <Badge variant="success">Passed</Badge>}
          </div>
        </div>
      </header>

      {showOutcome ? (
        <>
          <Results result={outcome.result} questions={outcome.questions} quiz={quiz} />
          <div className="mt-6 flex flex-wrap gap-3">
            {quiz.kind === 'practice' && (
              <Button
                variant="pixel"
                onClick={() => {
                  setOutcome(null)
                  setPicked({})
                }}
              >
                Try again
              </Button>
            )}
            {quiz.kind === 'zone' && !outcome.result.passed && quiz.retry && (
              <Button variant="pixel" onClick={() => start.mutate()} disabled={start.isPending}>
                Fight again
              </Button>
            )}
            <Link to={back.to} className={buttonVariants({ variant: 'secondary' })}>
              {quiz.kind === 'zone' ? 'Back to the map' : 'Back'}
            </Link>
          </div>
        </>
      ) : quiz.locked ? (
        <p className="border-2 border-[var(--color-border)] p-4 text-sm text-[var(--color-text-secondary)]">Clear every topic in this zone before fighting its boss.</p>
      ) : (quiz.status === 'passed' && quiz.kind !== 'practice') || quiz.defeated ? (
        <p className="border-2 border-[var(--color-success)]/50 p-4 text-sm text-[var(--color-text-secondary)]">
          {quiz.kind === 'zone' ? 'This boss is defeated.' : "You won today's quiz."}
        </p>
      ) : !quiz.available ? (
        <Card>
          <CardContent className="space-y-3 text-sm text-[var(--color-text-secondary)]">
            <p>These lessons don't have enough material to quiz on yet. Read the lesson instead.</p>
            {quiz.kind === 'zone' && (
              <Button variant="pixel" onClick={() => claim.mutate()} disabled={claim.isPending}>
                Open the next zone (no XP)
              </Button>
            )}
            {claim.isError && <p role="alert" className="text-[var(--color-error)]">{errorMessage(claim.error)}</p>}
          </CardContent>
        </Card>
      ) : live ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit.mutate(questions)
          }}
          className="space-y-4"
        >
          {secondsLeft !== null && (
            <p className={cn('flex items-center gap-2 font-pixel text-sm', secondsLeft < 60 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]')} role="timer">
              <Clock className="h-4 w-4" /> {timeUp ? "Time's up" : `${formatCountdown(secondsLeft * 1000)} left`}
            </p>
          )}
          {questions.map((q, i) => (
            <Question key={q.id} index={i} question={q} picked={picked[q.id]} onPick={(o) => setPicked((p) => ({ ...p, [q.id]: o }))} disabled={timeUp || submit.isPending} />
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="pixel" size="lg" disabled={timeUp || submit.isPending || answered === 0}>
              {submit.isPending ? 'Checking…' : `Submit ${answered}/${questions.length}`}
            </Button>
            {timeUp && (
              <Button type="button" variant="secondary" onClick={() => refetch()}>
                See what happened
              </Button>
            )}
          </div>
          {submit.isError && (
            <p role="alert" className="text-sm text-[var(--color-error)]">
              {errorMessage(submit.error)}
            </p>
          )}
        </form>
      ) : (
        <Card>
          <CardContent className="space-y-3">
            {quiz.status === 'failed' || quiz.status === 'timed_out' ? (
              <p className="text-sm text-[var(--color-text-secondary)]">
                {quiz.retry ? 'That run is over. Start again for a fresh set of questions.' : "You've had your run at this one. A new daily quiz starts at 00:00 UTC."}
              </p>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">The clock starts when you press the button. Answer from what you've learned.</p>
            )}
            {canStart && (
              <Button variant={quiz.kind === 'zone' ? 'pixelViolet' : 'pixel'} size="lg" onClick={() => start.mutate()} disabled={start.isPending}>
                {quiz.kind === 'zone' ? (quiz.status === 'not_started' ? 'Enter boss fight' : 'Fight again') : 'Start the quiz'}
              </Button>
            )}
            {start.isError && (
              <p role="alert" className="text-sm text-[var(--color-error)]">
                {errorMessage(start.error)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
