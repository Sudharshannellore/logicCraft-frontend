import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, RefreshCw } from 'lucide-react'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import type { FrameworkQuiz, FrameworkSummary } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { isSpriteName } from '@/components/pixel/sprites'
import { cn } from '@/utils/cn'
import { formatCountdown, useNow } from './utils'

function statusLabel(quiz: FrameworkQuiz) {
  if (quiz.locked) return { text: 'Locked', variant: 'neutral' as const }
  if (quiz.status === 'passed' || quiz.defeated) return { text: quiz.kind === 'zone' ? 'Defeated' : 'Won', variant: 'success' as const }
  if (quiz.status === 'in_progress') return { text: 'In progress', variant: 'warning' as const }
  if (quiz.status === 'failed' || quiz.status === 'timed_out') return { text: quiz.retry ? 'Try again' : 'Missed', variant: 'error' as const }
  return { text: 'Ready', variant: 'accent' as const }
}

function actionLabel(quiz: FrameworkQuiz) {
  if (quiz.locked) return 'See what unlocks it'
  if (quiz.status === 'passed' || quiz.defeated) return 'See results'
  if (quiz.status === 'in_progress') return 'Continue'
  if (quiz.status === 'failed' || quiz.status === 'timed_out') return quiz.retry ? 'Fight again' : 'See results'
  return quiz.kind === 'zone' ? 'Enter boss fight' : 'Start quiz'
}

function QuizCard({ quiz, now }: { quiz: FrameworkQuiz; now: number }) {
  const status = statusLabel(quiz)
  const isBoss = quiz.kind === 'zone'
  const sprite = isBoss && quiz.bossSprite && isSpriteName(quiz.bossSprite) ? quiz.bossSprite : 'star'
  return (
    <Card className={cn('flex flex-col', quiz.locked && 'opacity-70')}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="pixel-corners flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--color-accent-soft)]">
            <PixelSprite sprite={sprite} scale={isBoss ? 1.5 : 2.5} fps={isBoss ? 3 : 0} />
          </div>
          <div className="min-w-0">
            <p className="font-pixel text-xs uppercase tracking-wider text-[var(--color-accent)]">{isBoss ? 'Zone boss' : 'Daily quiz'}</p>
            <CardTitle className="truncate text-sm leading-tight">{isBoss && quiz.bossName ? quiz.bossName : quiz.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="mb-3 text-sm text-[var(--color-text-secondary)]">{quiz.description}</p>
        <div className="mb-4 mt-auto flex flex-wrap items-center gap-2">
          {quiz.timeLimitMinutes && (
            <Badge>
              <Clock className="h-3 w-3" /> {quiz.timeLimitMinutes}m
            </Badge>
          )}
          <Badge>Pass {quiz.passPercent}%</Badge>
          <Badge variant="accent">+{quiz.xp} XP</Badge>
          <Badge variant={status.variant}>{status.text}</Badge>
          {quiz.bestPercent != null && <Badge>Best {quiz.bestPercent}%</Badge>}
        </div>
        {quiz.endsAt && (
          <p className="mb-3 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <RefreshCw className="h-3 w-3" /> New quiz in {formatCountdown(quiz.endsAt - now)}
          </p>
        )}
        <Link to={`/quiz/${quiz.id}`} className={cn(buttonVariants({ variant: isBoss ? 'pixelViolet' : 'pixelDark' }), 'w-full')}>
          {actionLabel(quiz)}
        </Link>
      </CardContent>
    </Card>
  )
}

/** A framework's daily quiz and zone bosses. */
export function FrameworkChallenges({ framework }: { framework: FrameworkSummary }) {
  const now = useNow(15_000)
  const { data: quizzes, isError, error } = useQuery({
    queryKey: ['framework-challenges', framework.courseId],
    queryFn: () => api.getFrameworkChallenges(framework.courseId),
    refetchInterval: 3 * 60_000,
  })

  if (isError) return <p className="py-10 text-center text-sm text-[var(--color-text-secondary)]">{errorMessage(error)}</p>
  if (!quizzes) return <p className="py-10 text-center font-pixel text-sm text-[var(--color-text-muted)]">Summoning challenges…</p>

  const daily = quizzes.filter((q) => q.kind === 'daily')
  const bosses = quizzes.filter((q) => q.kind === 'zone')
  return (
    <div className="space-y-8">
      <p className="max-w-2xl text-sm text-[var(--color-text-secondary)]">
        {framework.title} can't be graded like a language's exercises, so its challenges are quizzes on the docs themselves. Every player gets the same daily quiz; a
        boss opens once you've cleared its zone's lessons.
      </p>
      {daily.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl">Today</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {daily.map((q) => (
              <QuizCard key={q.id} quiz={q} now={now} />
            ))}
          </div>
        </section>
      )}
      {bosses.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl">Zone bosses</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {bosses.map((q) => (
              <QuizCard key={q.id} quiz={q} now={now} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
