import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, ExternalLink, RefreshCw, Users } from 'lucide-react'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, difficultyVariant } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { PageLoader } from '@/components/layout/PageLoader'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { LanguagePicker } from '@/components/learning/LanguagePicker'
import { FrameworkPicker } from '@/components/learning/FrameworkPicker'
import { ModeTabs, type Mode } from '@/components/learning/ModeTabs'
import { FrameworkChallenges } from './FrameworkChallenges'
import { FriendDuels } from '@/components/duels/FriendDuels'
import type { LiveChallenge } from '@/types'
import { cn } from '@/utils/cn'
import { FastestBoard, StatusBadge } from './shared'
import { KIND_META, bossSprite, challengeHref, formatCountdown, secondsLeft, useNow } from './utils'

function actionLabel(challenge: LiveChallenge, now: number) {
  if (!challenge.gradable) return 'View on Exercism'
  switch (challenge.me.status) {
    case 'in_progress':
      return `Continue · ${formatCountdown((secondsLeft(challenge, now) ?? 0) * 1000)} left`
    case 'won':
    case 'ended':
      return 'See results'
    case 'timed_out':
      return challenge.kind === 'boss' ? 'Try again' : 'See results'
    default:
      return challenge.kind === 'boss' ? 'Enter boss fight' : 'Start challenge'
  }
}

function ChallengeCard({ challenge, now }: { challenge: LiveChallenge; now: number }) {
  const meta = KIND_META[challenge.kind]
  const isBoss = challenge.kind === 'boss'
  const sprite = bossSprite(challenge)
  const exercise = challenge.stages[0]

  return (
    <Card className="flex flex-col transition-all hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="pixel-corners flex h-12 w-12 shrink-0 items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${meta.color} 14%, transparent)` }}>
            <PixelSprite sprite={sprite} scale={isBoss ? 1.5 : 2.5} fps={isBoss ? 3 : 0} />
          </div>
          <div className="min-w-0">
            <p className="font-pixel text-xs uppercase tracking-wider" style={{ color: meta.color }}>
              {meta.label}
            </p>
            <CardTitle className="truncate text-sm leading-tight">{isBoss ? challenge.bossName : exercise.name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="mb-3 text-sm text-[var(--color-text-secondary)]">{challenge.description}</p>

        {isBoss ? (
          <ol className="mb-4 space-y-1">
            {challenge.stages.map((stage, i) => (
              <li key={stage.slug} className="flex items-center gap-2 text-sm">
                <span className={cn('font-pixel text-xs', stage.cleared ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]')}>{stage.cleared ? '✓' : `${i + 1}.`}</span>
                <span className="min-w-0 flex-1 truncate">{stage.name}</span>
                <Badge variant={difficultyVariant(stage.difficulty)} className="capitalize">
                  {stage.difficulty}
                </Badge>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mb-4 flex flex-wrap gap-1.5">
            <Badge variant={difficultyVariant(exercise.difficulty)} className="capitalize">
              {exercise.difficulty}
            </Badge>
            <Badge variant="neutral">Level {exercise.level}/10</Badge>
            {exercise.topics.slice(0, 2).map((t) => (
              <Badge key={t} variant="neutral" className="font-sans normal-case">
                {t}
              </Badge>
            ))}
          </div>
        )}

        <div className="mb-4 mt-auto flex flex-wrap items-center gap-2">
          <Badge variant="neutral" title="Time limit">
            <Clock className="h-3 w-3" /> {challenge.gradable ? `${challenge.timeLimitMinutes}m` : 'Untimed'}
          </Badge>
          {challenge.gradable && (
            <Badge variant="accent" title="Bonus for winning, on top of each exercise's XP">
              +{challenge.bonusXp} XP
            </Badge>
          )}
          <Badge variant="neutral" title={`${challenge.players} started · ${challenge.winners} won`}>
            <Users className="h-3 w-3" /> {challenge.winners}/{challenge.players} won
          </Badge>
          <StatusBadge challenge={challenge} />
        </div>

        <FastestBoard challenge={{ ...challenge, fastest: challenge.fastest.slice(0, 3) }} className="mb-4" />

        {challenge.endsAt && (
          <p className="mb-3 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <RefreshCw className="h-3 w-3" /> New {isBoss ? 'boss' : 'challenge'} in {formatCountdown(challenge.endsAt - now)}
          </p>
        )}

        <Link to={challengeHref(challenge)} className={cn(buttonVariants({ variant: isBoss ? 'pixelViolet' : 'pixelDark' }), 'w-full')}>
          {actionLabel(challenge, now)}
        </Link>
      </CardContent>
    </Card>
  )
}

function Board({ language }: { language: string }) {
  const now = useNow(15_000)
  const { data: challenges, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['challenges', language],
    queryFn: () => api.getChallenges(language),
    // A new challenge goes live at 00:00 UTC; refetching every few minutes also refreshes the counts.
    refetchInterval: 3 * 60_000,
  })

  if (isLoading) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-16 text-center">
        <PixelSprite sprite="heroRun" scale={3} fps={8} />
        <p className="font-pixel text-sm uppercase tracking-widest text-[var(--color-accent)]">Summoning today's challenges…</p>
        <p className="text-xs text-[var(--color-text-muted)]">The first visit of the day test-runs each pick, so it can take a few seconds.</p>
      </div>
    )
  }
  if (isError || !challenges) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <PixelSprite sprite="bugSlime" scale={4} fps={3} />
          <p className="text-sm text-[var(--color-text-secondary)]">{errorMessage(error)}</p>
          <Button onClick={() => void refetch()} disabled={isFetching}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const languageName = challenges[0]?.languageName ?? language
  return (
    <>
      {!challenges[0]?.gradable && (
        <p className="mb-4 flex items-start gap-2 border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
          {languageName} tests run on Exercism's free online editor, so these challenges aren't timed here and pay no bonus. Python, JavaScript, TypeScript and SQL are graded on Logicraft.
        </p>
      )}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} now={now} />
        ))}
      </div>
    </>
  )
}

export default function Challenges() {
  const { data: languages } = useQuery({ queryKey: ['library', 'languages'], queryFn: api.getLibraryLanguages, staleTime: 10 * 60_000 })
  const [params, setParams] = useSearchParams()
  const selected = params.get('lang') ?? 'python'
  const mode: Mode = params.get('mode') === 'frameworks' ? 'frameworks' : 'languages'

  if (!languages) return <PageLoader />

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <PixelSprite sprite="sword" scale={3} />
          Challenges
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Live challenges drawn from{' '}
          <a href="https://exercism.org" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">
            Exercism
          </a>
          's open-source tracks. Every player gets the same picks; a new Daily and Speed challenge starts at 00:00 UTC and a new boss every Monday.
        </p>
      </div>

      <FriendDuels />

      <h2 className="mb-4 text-xl">Solo challenges</h2>
      <ModeTabs value={mode} onChange={(m) => setParams(m === 'frameworks' ? { mode: 'frameworks' } : {}, { replace: true })} />
      {mode === 'frameworks' ? (
        <FrameworkPicker value={params.get('fw')} onChange={(id) => setParams({ mode: 'frameworks', fw: id }, { replace: true })}>
          {(framework) => <FrameworkChallenges key={framework.courseId} framework={framework} />}
        </FrameworkPicker>
      ) : (
        <>
          <LanguagePicker languages={languages} value={selected} onChange={(id) => setParams({ lang: id }, { replace: true })} />
          <Board key={selected} language={selected} />
        </>
      )}
    </div>
  )
}
