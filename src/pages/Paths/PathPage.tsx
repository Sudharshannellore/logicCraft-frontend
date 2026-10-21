import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import type { CareerPathDetail, PathStepState } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PageLoader } from '@/components/layout/PageLoader'
import { PathSprite } from '@/components/learning/PathCard'
import { languageMeta } from '@/components/learning/languages'
import { cn } from '@/utils/cn'

const STATE: Record<PathStepState, { label: string; variant: 'success' | 'warning' | 'accent' | 'neutral'; action: string }> = {
  completed: { label: 'Completed', variant: 'success', action: 'Review' },
  in_progress: { label: 'In progress', variant: 'warning', action: 'Continue' },
  next: { label: 'Up next', variant: 'accent', action: 'Start' },
  available: { label: 'Available', variant: 'neutral', action: 'Start' },
}

export default function PathPage() {
  const { pathId = '' } = useParams<{ pathId: string }>()
  const queryClient = useQueryClient()
  const { data: path, error } = useQuery({ queryKey: ['path', pathId], queryFn: () => api.getPath(pathId), enabled: Boolean(pathId) })

  const choose = useMutation({
    mutationFn: (enroll: boolean) => (enroll ? api.enrollPath(pathId) : api.leavePath(pathId)),
    onSuccess: (updated: CareerPathDetail) => {
      queryClient.setQueryData(['path', pathId], updated)
      void queryClient.invalidateQueries({ queryKey: ['paths'] })
    },
  })

  if (path === null || error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-xl">{error ? "Couldn't load this path" : 'Path not found'}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{error ? errorMessage(error) : 'It may have been renamed, or its courses are unavailable right now.'}</p>
        <Link to="/paths" className={cn(buttonVariants({ variant: 'pixel' }), 'mt-6')}>
          All career paths
        </Link>
      </div>
    )
  }
  if (!path) return <PageLoader />

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Link to="/paths" className="mb-4 inline-flex items-center gap-1.5 font-pixel text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
        <ArrowLeft className="h-4 w-4" /> Career paths
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <PathSprite name={path.sprite} scale={4} />
          <div>
            <h1 className="text-2xl font-bold">{path.title}</h1>
            <p className="mt-1 max-w-xl text-sm text-[var(--color-text-secondary)]">{path.description}</p>
            {path.recommended && path.reason && <Badge variant="accent" className="mt-3">{path.reason}</Badge>}
          </div>
        </div>
        <Button
          variant={path.enrolled ? 'secondary' : 'pixel'}
          onClick={() => choose.mutate(!path.enrolled)}
          disabled={choose.isPending}
          aria-pressed={path.enrolled}
          className="shrink-0"
        >
          {path.enrolled ? 'Following · Leave path' : 'Follow this path'}
        </Button>
      </div>
      {choose.isError && <p role="alert" className="mb-3 text-sm text-[var(--color-error)]">{errorMessage(choose.error)}</p>}

      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center justify-between font-pixel text-sm">
            <span>
              {path.completedSteps} of {path.totalSteps} courses done
            </span>
            <span className="text-[var(--color-accent)]">{path.progressPercent}%</span>
          </div>
          <ProgressBar percent={path.progressPercent} className="mt-2" />
        </CardContent>
      </Card>

      <ol className="space-y-4">
        {path.steps.map(({ course, state }, i) => {
          const meta = STATE[state]
          const done = state === 'completed'
          return (
            <li key={course.id}>
              <Card className={cn(state === 'next' && 'border-[var(--color-accent)]', done && 'opacity-90')}>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center border-2 font-pixel text-lg',
                      done ? 'border-[var(--color-success)] bg-[var(--color-success)]/15 text-[var(--color-success)]' : 'border-[var(--color-border-strong)] text-[var(--color-text-secondary)]',
                    )}
                    aria-hidden
                  >
                    {done ? <Check className="h-5 w-5" /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{course.title}</h2>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      <Badge>{course.kind === 'framework' ? 'Framework' : 'Language'}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      {course.world} · {languageMeta(course.language).label} · {course.totalXp.toLocaleString()} XP
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <ProgressBar percent={course.progressPercent} className="flex-1" />
                      <span className="font-mono text-xs text-[var(--color-accent)]">{course.progressPercent}%</span>
                    </div>
                  </div>
                  <Link
                    to={`/learn/${course.id}`}
                    className={cn(buttonVariants({ variant: state === 'next' || state === 'in_progress' ? 'pixel' : 'secondary' }), 'shrink-0')}
                  >
                    {meta.action}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ol>
      <p className="mt-4 text-xs text-[var(--color-text-muted)]">The order is a suggestion. Start with whichever course you like.</p>
    </div>
  )
}
