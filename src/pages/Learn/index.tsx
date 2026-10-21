import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { api } from '@/services/api'
import type { Course } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PageLoader } from '@/components/layout/PageLoader'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { languageMeta, TRACKS, type Track } from '@/components/learning/languages'
import { cn } from '@/utils/cn'
import { PathCard } from '@/components/learning/PathCard'
import { isContinuing } from '@/utils/courses'

type Filter = 'All' | 'In progress' | 'Languages' | 'Frameworks' | Track

const isFramework = (course: Course) => course.kind === 'framework'

function CourseCard({ course }: { course: Course }) {
  const meta = languageMeta(course.language)
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-col items-start gap-1">
        <div className="flex w-full items-center justify-between gap-3">
          <p className="font-pixel text-sm uppercase tracking-wide text-[var(--color-accent)]">{course.world}</p>
          <PixelSprite sprite={meta.sprite} scale={3} className="animate-pixel-hover" />
        </div>
        <CardTitle className="text-lg">{course.title}</CardTitle>
        <div className="flex gap-1.5">
          <span className="border-2 border-[var(--color-border-strong)] px-1.5 font-pixel text-[11px] text-[var(--color-text-secondary)]">{meta.label}</span>
          <span className="border-2 border-[var(--color-violet)]/40 px-1.5 font-pixel text-[11px] text-[var(--color-violet)]">
            {isFramework(course) ? 'Framework' : meta.track}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="flex-1 text-sm text-[var(--color-text-secondary)]">{course.description}</p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)]">Progress</span>
            <span className="font-mono text-[var(--color-accent)]">{course.progressPercent}%</span>
          </div>
          <ProgressBar percent={course.progressPercent} className="mt-1.5" />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>{course.modules.reduce((n, m) => n + m.lessonsCount, 0)} lessons</span>
          <span className="font-mono">{course.totalXp.toLocaleString()} XP total</span>
        </div>
        <Link to={`/learn/${course.id}`} className={cn(buttonVariants({ variant: 'secondary' }), 'mt-4 w-full')}>
          {course.progressPercent > 0 ? 'Continue' : 'Start'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  )
}

export default function Learn() {
  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: api.getCourses })
  const { data: paths } = useQuery({ queryKey: ['paths'], queryFn: api.getPaths })
  const [filter, setFilter] = useState<Filter>('All')

  if (!courses) return <PageLoader />

  const started = courses.filter((c) => c.progressPercent > 0)
  const hasFrameworks = courses.some(isFramework)
  const filters: Filter[] = [
    'All',
    ...(started.length ? (['In progress'] as const) : []),
    ...(hasFrameworks ? (['Languages', 'Frameworks'] as const) : []),
    ...TRACKS.filter((t) => courses.some((c) => languageMeta(c.language).track === t)),
  ]
  const matches = (c: Course, f: Filter) =>
    f === 'All'
      ? true
      : f === 'In progress'
        ? c.progressPercent > 0
        : f === 'Languages'
          ? !isFramework(c)
          : f === 'Frameworks'
            ? isFramework(c)
            : languageMeta(c.language).track === f
  const shown = courses.filter((c) => matches(c, filter))
  // Paths worth a look now: ones that build on what the player has already done.
  const suggestedPaths = (paths ?? []).filter((p) => p.recommended).slice(0, 3)
  // Courses the player is partway through come first, furthest along on top; finished ones go last.
  const continuing = shown.filter(isContinuing).sort((a, b) => b.progressPercent - a.progressPercent)
  const rest = shown.filter((c) => !isContinuing(c)).sort((a, b) => Number(a.progressPercent >= 100) - Number(b.progressPercent >= 100))

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Learn</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {courses.length} worlds: the industry-standard languages, and the frameworks built on them. Each has its own map of topics to conquer.
        </p>
        <Link to="/paths" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline">
          Browse career paths <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {suggestedPaths.length > 0 && (
        <section className="mb-8" aria-labelledby="next-steps-heading">
          <h2 id="next-steps-heading" className="font-pixel text-sm uppercase tracking-wider text-[var(--color-accent)]">
            Your next steps
          </h2>
          <p className="mb-3 mt-1 text-sm text-[var(--color-text-secondary)]">Career paths that build on what you've learned.</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedPaths.map((p) => (
              <PathCard key={p.id} path={p} />
            ))}
          </div>
        </section>
      )}

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter courses">
        {filters.map((f) => {
          const count = courses.filter((c) => matches(c, f)).length
          return (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                'border-2 px-3 py-1.5 font-pixel text-xs uppercase tracking-wider transition-colors',
                filter === f
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[#06120a]'
                  : 'border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              )}
            >
              {f} <span className="opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {continuing.length > 0 && (
        <section className="mb-8" aria-labelledby="continue-heading">
          <h2 id="continue-heading" className="mb-3 font-pixel text-sm uppercase tracking-wider text-[var(--color-accent)]">
            Continue learning
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {continuing.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section aria-labelledby="all-heading">
          {continuing.length > 0 && (
            <h2 id="all-heading" className="mb-3 font-pixel text-sm uppercase tracking-wider text-[var(--color-text-muted)]">
              {filter === 'All' ? 'More worlds' : filter}
            </h2>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
