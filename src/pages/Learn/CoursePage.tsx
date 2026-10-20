import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardContent } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import { PageLoader } from '@/components/layout/PageLoader'
import { EmptyStateArt } from '@/components/illustrations/EmptyStateArt'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { PixelBar } from '@/components/pixel/PixelBar'
import { WorldMap } from '@/components/learning/WorldMap'
import { languageMeta } from '@/components/learning/languages'
import { cn } from '@/utils/cn'

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.getCourse(courseId ?? ''),
    enabled: Boolean(courseId),
  })
  const { data: path } = useQuery({
    queryKey: ['course-path', courseId],
    queryFn: () => api.getCoursePath(courseId ?? ''),
    enabled: Boolean(courseId),
  })

  if (isLoading || !path) return <PageLoader />

  if (!course) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <EmptyStateArt className="h-28 w-48" />
            <div>
              <p className="font-pixel text-lg">We couldn't find that course</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                It may have moved, or the link might be outdated.
              </p>
            </div>
            <Link to="/learn" className={cn(buttonVariants({ variant: 'secondary' }))}>
              <ArrowLeft className="h-4 w-4" />
              Back to Learn
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const worldSprite = languageMeta(course.language).sprite
  const topics = path.flatMap((z) => z.nodes)
  const clearedTopics = topics.filter((n) => n.state === 'completed').length
  const bossesDown = path.filter((z) => z.boss.state === 'completed').length
  // Continue where the map says you are; once everything is cleared, revisit the last topic.
  const nextTopic = topics.find((n) => n.state === 'current') ?? topics[topics.length - 1]

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link to="/learn" className="mb-4 inline-flex items-center gap-1.5 font-pixel text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
        <ArrowLeft className="h-4 w-4" />
        Back to Learn
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="pixel-corners relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#08090b_0%,#1a1130_100%)]">
            <span className="animate-pixel-twinkle absolute left-2 top-2 h-1 w-1 bg-white" />
            <span className="animate-pixel-twinkle absolute right-3 top-4 h-1 w-1 bg-white [animation-delay:0.5s]" />
            <PixelSprite sprite={worldSprite} scale={4} fps={2} className="animate-pixel-hover" />
          </div>
          <div>
            <p className="font-pixel text-sm uppercase tracking-wider text-[var(--color-accent)]">{course.world}</p>
            <h1 className="mt-1 text-2xl font-bold">{course.title}</h1>
            <p className="mt-1 max-w-xl text-sm text-[var(--color-text-secondary)]">{course.description}</p>
          </div>
        </div>
        <Link
          to={nextTopic ? `/learn/${course.id}/${nextTopic.lessonId}` : `/learn/${course.id}`}
          className={cn(buttonVariants({ size: 'lg' }), 'shrink-0')}
        >
          Continue Learning
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center justify-between font-pixel text-sm">
            <span>World progress</span>
            <span className="text-[var(--color-accent)]">{course.progressPercent}%</span>
          </div>
          <PixelBar percent={course.progressPercent} segments={24} size="lg" className="mt-2" label="Overall course progress" />
          <div className="mt-3 flex items-center justify-between font-pixel text-xs text-[var(--color-text-muted)]">
            <span>
              {clearedTopics}/{topics.length} topics cleared · {bossesDown}/{path.length} bosses defeated
            </span>
            <span className="text-[var(--color-warning)]">{course.totalXp.toLocaleString()} XP total</span>
          </div>
        </CardContent>
      </Card>

      {path.length > 0 && (
        <section aria-label="World map">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <PixelSprite sprite="treasureMap" scale={2.5} />
              <div>
                <h2 className="text-xl">World Map</h2>
                <p className="text-xs text-[var(--color-text-secondary)]">Clear every topic in a zone, then beat its boss to open the next gate.</p>
              </div>
            </div>
            <ul className="flex flex-wrap items-center gap-4 font-pixel text-xs text-[var(--color-text-secondary)]" aria-label="Map legend">
              <li className="flex items-center gap-1.5">
                <PixelSprite sprite="star" scale={1.25} /> Cleared
              </li>
              <li className="flex items-center gap-1.5">
                <PixelSprite sprite="hero" scale={1} /> You are here
              </li>
              <li className="flex items-center gap-1.5">
                <PixelSprite sprite="lock" scale={1} /> Locked
              </li>
              <li className="flex items-center gap-1.5">
                <PixelSprite sprite="slime" scale={1} /> Boss level
              </li>
            </ul>
          </div>
          <WorldMap zones={path} lessonHref={(node) => `/learn/${course.id}/${node.lessonId}`} bossHref={(boss) => `/learn/${course.id}/boss/${boss.id}`} />
        </section>
      )}

    </div>
  )
}
