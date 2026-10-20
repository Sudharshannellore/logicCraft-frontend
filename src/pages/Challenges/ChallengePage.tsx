import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Clock, ExternalLink, Lock, Swords, Users } from 'lucide-react'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { useAuthStore } from '@/stores/authStore'
import { useWalletStore } from '@/stores/walletStore'
import { formatDuration } from '@/stores/socialStore'
import { Badge, difficultyVariant } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { PageLoader } from '@/components/layout/PageLoader'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { BossArena, formatClock } from '@/components/gamification/BossArena'
import { VictoryOverlay } from '@/components/gamification/VictoryOverlay'
import { ExerciseWorkspace } from '@/components/practice/ExerciseWorkspace'
import type { ChallengeSubmitResult, LiveChallenge } from '@/types'
import { cn } from '@/utils/cn'
import { FastestBoard, StatusBadge } from './shared'
import { KIND_META, bossSprite, formatCountdown, secondsLeft, useNow } from './utils'

interface Victory {
  bonusXp: number
  exerciseXp: number
  seconds: number | null
}

/** The challenge (or zone boss) this route points at, and the calls that act on it. */
function useChallengeRoute() {
  const { challengeId, courseId, bossId } = useParams()
  const zone = courseId && bossId ? { courseId, bossId } : null
  const id = challengeId ?? ''
  const queryKey = useMemo(() => (courseId && bossId ? ['zone-boss', courseId, bossId] : ['challenge', id]), [courseId, bossId, id])
  return {
    queryKey,
    zone,
    backHref: zone ? `/learn/${zone.courseId}` : null,
    load: () => (zone ? api.getZoneBoss(zone.courseId, zone.bossId) : api.getChallenge(id)),
    start: () => (zone ? api.startZoneBoss(zone.courseId, zone.bossId) : api.startChallenge(id)),
    submit: (slug: string, files: Record<string, string>) =>
      zone ? api.submitZoneBoss(zone.courseId, zone.bossId, slug, files) : api.submitChallenge(id, slug, files),
  }
}

function StageList({ challenge }: { challenge: LiveChallenge }) {
  const current = challenge.me.status === 'in_progress' ? challenge.stages.find((s) => !s.cleared)?.slug : undefined
  return (
    <ol className="space-y-2">
      {challenge.stages.map((stage, i) => {
        const state = stage.cleared ? 'cleared' : stage.slug === current ? 'current' : 'waiting'
        return (
          <li
            key={stage.slug}
            className={cn(
              'flex flex-wrap items-center gap-3 border-2 px-3 py-2.5',
              state === 'cleared' && 'border-[var(--color-success)]/40 bg-[var(--color-success)]/5',
              state === 'current' && 'border-[var(--color-violet)] bg-[var(--color-violet-soft)]',
              state === 'waiting' && 'border-[var(--color-border)]',
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center border-2 font-pixel',
                state === 'cleared' ? 'border-[var(--color-success)] text-[var(--color-success)]' : 'border-[var(--color-border-strong)] text-[var(--color-text-muted)]',
              )}
            >
              {state === 'cleared' ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{stage.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Level {stage.level}/10{stage.topics.length > 0 && ` · ${stage.topics.slice(0, 3).join(', ')}`}
              </p>
            </div>
            <Badge variant={difficultyVariant(stage.difficulty)} className="capitalize">
              {stage.difficulty}
            </Badge>
            {!challenge.gradable && (
              <a href={stage.exercismUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                <ExternalLink className="h-3.5 w-3.5" /> Exercism
              </a>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Lobby({ challenge, onPlay, backHref }: { challenge: LiveChallenge; onPlay: () => void; backHref: string }) {
  const queryClient = useQueryClient()
  const route = useChallengeRoute()
  const user = useAuthStore((s) => s.user)
  const now = useNow()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const meta = KIND_META[challenge.kind]
  const isBoss = challenge.kind === 'boss' || challenge.kind === 'zone'
  const left = secondsLeft(challenge, now)
  const { status } = challenge.me
  const cleared = challenge.stages.filter((s) => s.cleared).length

  const start = async () => {
    setBusy(true)
    setError(null)
    try {
      queryClient.setQueryData(route.queryKey, await route.start())
      onPlay()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const claim = async () => {
    if (!route.zone) return
    setBusy(true)
    setError(null)
    try {
      await api.claimZoneBoss(route.zone.courseId, route.zone.bossId)
      await queryClient.invalidateQueries({ queryKey: ['course-path', route.zone.courseId] })
      await queryClient.invalidateQueries({ queryKey: route.queryKey })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const retry = status === 'timed_out' && isBoss
  let action: React.ReactNode = null
  if (challenge.locked) {
    action = (
      <p className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <Lock className="h-4 w-4" /> Clear every topic in this zone to face its boss.
      </p>
    )
  } else if (!challenge.gradable) {
    action =
      challenge.kind === 'zone' && status !== 'won' ? (
        <div className="space-y-2">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {challenge.languageName} tests run on Exercism. Solve each round there, then open the gate. XP is only paid for fights graded on Logicraft.
          </p>
          <Button variant="pixelViolet" size="lg" className="w-full" onClick={() => void claim()} disabled={busy}>
            I beat every round. Open the gate
          </Button>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)]">
          {challenge.languageName} tests run on Exercism's free online editor. Open each exercise there; this challenge isn't timed and pays no bonus.
        </p>
      )
  } else if (status === 'in_progress') {
    action = (
      <Button variant="pixelViolet" size="lg" className="w-full" onClick={onPlay}>
        <Swords className="h-4 w-4" /> Continue: {left != null ? formatClock(left) : ''} left
      </Button>
    )
  } else if (status === 'not_started' || retry) {
    action = (
      <Button variant={isBoss ? 'pixelViolet' : 'pixel'} size="lg" className="w-full" onClick={() => void start()} disabled={busy}>
        <Clock className="h-4 w-4" /> {busy ? 'Starting…' : retry ? 'Try again from round 1' : `Start the clock (${challenge.timeLimitMinutes} min)`}
      </Button>
    )
  } else if (status === 'won') {
    action = (
      <p className="flex items-center gap-2 font-pixel text-[var(--color-success)]">
        <Check className="h-5 w-5" /> {challenge.kind === 'zone' ? 'Boss defeated. The next zone is open.' : `Won in ${formatDuration(challenge.me.seconds ?? 0)}`}
      </p>
    )
  } else if (status === 'timed_out') {
    action = (
      <p className="text-sm text-[var(--color-text-secondary)]">
        Time's up for this one. You can still solve it in Practice for the exercise XP{challenge.endsAt ? `, and a new challenge starts in ${formatCountdown(challenge.endsAt - now)}` : ''}.
      </p>
    )
  } else {
    action = <p className="text-sm text-[var(--color-text-secondary)]">This challenge has ended. A new one is already live.</p>
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Link to={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
        <ArrowLeft className="h-4 w-4" /> {challenge.kind === 'zone' ? 'Back to the map' : 'All challenges'}
      </Link>

      {isBoss ? (
        <BossArena
          name={challenge.bossName ?? challenge.title}
          sprite={bossSprite(challenge)}
          caption={challenge.kind === 'zone' ? challenge.description : `${challenge.languageName} · ${challenge.period}`}
          playerLabel={user ? `YOU · LV ${user.level}` : 'YOU'}
          secondsLeft={left}
          timeLimitMinutes={challenge.timeLimitMinutes}
          rewardXp={challenge.bonusXp}
          hpPercent={((challenge.stages.length - cleared) / challenge.stages.length) * 100}
        />
      ) : (
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-center gap-4 pt-6">
            <div className="pixel-corners flex h-16 w-16 shrink-0 items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${meta.color} 14%, transparent)` }}>
              <PixelSprite sprite={meta.sprite} scale={3.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-pixel text-xs uppercase tracking-wider" style={{ color: meta.color }}>
                {meta.label} · {challenge.languageName} · {challenge.period}
              </p>
              <h1 className="font-pixel text-2xl">{challenge.stages[0].name}</h1>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{challenge.description}</p>
            </div>
            <div className="text-right">
              {left != null ? (
                <p className={cn('font-pixel text-3xl tabular-nums', left < 60 && 'text-[var(--color-error)]')}>{formatClock(left)}</p>
              ) : (
                <p className="font-pixel text-xl">{challenge.timeLimitMinutes} min</p>
              )}
              {challenge.gradable && <p className="font-pixel text-sm text-[var(--color-accent)]">+{challenge.bonusXp} XP bonus</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">{isBoss ? 'Rounds' : 'Exercise'}</h2>
              <StatusBadge challenge={challenge} />
            </div>
            <StageList challenge={challenge} />
            {error && (
              <p role="alert" className="border-2 border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-3 py-2 text-sm">
                {error}
              </p>
            )}
            {action}
            {challenge.gradable && !challenge.locked && status === 'not_started' && (
              <p className="text-xs text-[var(--color-text-muted)]">
                The clock runs on the server from the moment you start. {isBoss ? 'Clear the rounds in order; if time runs out, the boss heals and you can try again.' : 'You get one run at it.'} Each exercise also pays its usual XP the first time you solve it.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <Users className="h-4 w-4" /> {challenge.players} started · {challenge.winners} won
            </p>
            <FastestBoard challenge={challenge} />
            {challenge.endsAt && (
              <p className="text-xs text-[var(--color-text-muted)]">Rotates in {formatCountdown(challenge.endsAt - now)}.</p>
            )}
            <p className="border-t-2 border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-muted)]">
              Exercises from{' '}
              <a href={challenge.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">
                Exercism's {challenge.languageName} track
              </a>{' '}
              (MIT licence).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/** The timed board: the current round's exercise in the editor, with the clock in the header. */
function Play({ challenge, onExit, onWon }: { challenge: LiveChallenge; onExit: string; onWon: (v: Victory) => void }) {
  const queryClient = useQueryClient()
  const route = useChallengeRoute()
  const setBalance = useWalletStore((s) => s.setBalance)
  const now = useNow()
  const [notice, setNotice] = useState<string | null>(null)
  const stage = challenge.stages.find((s) => !s.cleared) ?? challenge.stages[challenge.stages.length - 1]
  const index = challenge.stages.indexOf(stage)
  const left = secondsLeft(challenge, now) ?? 0

  const { data: exercise, isError, error } = useQuery({
    queryKey: ['library-exercise', challenge.language, stage.slug],
    queryFn: () => api.getLibraryExercise(challenge.language, stage.slug),
    staleTime: 10 * 60_000,
  })

  // When the clock runs out, reload: the server decides what happens next.
  useEffect(() => {
    if (left === 0) void queryClient.invalidateQueries({ queryKey: route.queryKey })
  }, [left, queryClient, route.queryKey])

  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(id)
  }, [notice])

  const submit = async (files: Record<string, string>) => {
    const response: ChallengeSubmitResult = await route.submit(stage.slug, files)
    setBalance(response.balance)
    queryClient.setQueryData(route.queryKey, response.challenge)
    void queryClient.invalidateQueries({ queryKey: ['library'] })
    void queryClient.invalidateQueries({ queryKey: ['daily-quest'] })
    if (response.won) {
      void queryClient.invalidateQueries({ queryKey: ['challenges'] })
      if (challenge.courseId) void queryClient.invalidateQueries({ queryKey: ['course-path', challenge.courseId] })
      onWon({ bonusXp: response.bonusXp, exerciseXp: response.result.awardedXp ?? 0, seconds: response.challenge.me.seconds })
    } else if (response.result.status === 'passed') {
      const next = response.challenge.stages.find((s) => !s.cleared)
      setNotice(next ? `Round ${index + 1} cleared! Next: ${next.name}` : 'Passed!')
    }
    return response.result
  }

  if (isError) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <PixelSprite sprite="bugSlime" scale={5} fps={3} />
        <p className="text-sm text-[var(--color-text-secondary)]">{errorMessage(error)}</p>
        <Link to={onExit} className={buttonVariants()}>
          Back
        </Link>
      </div>
    )
  }
  if (!exercise) return <PageLoader />

  const clock = (
    <div className="flex items-center gap-2">
      {notice && (
        <span role="status" className="border-2 border-[var(--color-success)]/50 bg-[var(--color-success)]/15 px-2 py-1 font-pixel text-xs text-[var(--color-success)]">
          {notice}
        </span>
      )}
      {challenge.stages.length > 1 && (
        <span className="font-pixel text-xs text-[var(--color-text-muted)]">
          Round {index + 1}/{challenge.stages.length}
        </span>
      )}
      <span
        aria-label="Time left"
        className={cn(
          'border-2 px-2 py-1 font-pixel text-lg tabular-nums',
          left < 60 ? 'animate-pixel-twinkle border-[var(--color-error)] text-[var(--color-error)]' : 'border-[var(--color-border-strong)]',
        )}
      >
        <Clock className="mr-1 inline h-4 w-4" />
        {formatClock(left)}
      </span>
    </div>
  )

  return (
    <ExerciseWorkspace
      key={stage.slug}
      exercise={exercise}
      backHref={onExit}
      backLabel="Back to the challenge"
      onSubmit={submit}
      headerExtra={clock}
      disabled={left === 0}
    />
  )
}

export default function ChallengePage() {
  const route = useChallengeRoute()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [victory, setVictory] = useState<Victory | null>(null)
  const { data: challenge, isLoading, error } = useQuery({ queryKey: route.queryKey, queryFn: route.load, staleTime: 30_000 })

  if (isLoading) return <PageLoader />
  if (!challenge) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <PixelSprite sprite="bugSlime" scale={5} fps={3} className="animate-pixel-bob" />
        <h1 className="text-xl font-bold">Couldn't load this challenge</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">{errorMessage(error)}</p>
        <Link to={route.backHref ?? '/challenges'} className={buttonVariants()}>
          Back
        </Link>
      </div>
    )
  }

  const backHref = route.backHref ?? `/challenges?lang=${challenge.language}`
  const playing = params.get('play') === '1' && challenge.me.status === 'in_progress' && challenge.gradable
  const lobbyHref = window.location.pathname

  return (
    <>
      {playing ? (
        <Play challenge={challenge} onExit={lobbyHref} onWon={setVictory} />
      ) : (
        <Lobby challenge={challenge} backHref={backHref} onPlay={() => setParams({ play: '1' })} />
      )}
      <VictoryOverlay
        open={victory !== null}
        xp={victory ? victory.bonusXp + victory.exerciseXp : 0}
        awardedXp={victory ? victory.bonusXp + victory.exerciseXp : 0}
        title={challenge.kind === 'boss' || challenge.kind === 'zone' ? `${challenge.bossName ?? 'Boss'} defeated!` : `${KIND_META[challenge.kind].label} won!`}
        extra={victory?.seconds != null ? <p className="font-pixel text-sm">Time: {formatDuration(victory.seconds)}</p> : undefined}
        onClose={() => {
          setVictory(null)
          if (challenge.kind === 'zone' && route.backHref) navigate(route.backHref)
          else setParams({})
        }}
      />
    </>
  )
}
