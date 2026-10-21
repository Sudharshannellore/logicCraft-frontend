import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { CareerPathSummary } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { isSpriteName } from '@/components/pixel/sprites'
import { cn } from '@/utils/cn'

export function PathSprite({ name, scale = 3 }: { name: string; scale?: number }) {
  return <PixelSprite sprite={isSpriteName(name) ? name : 'compass'} scale={scale} className="animate-pixel-hover" />
}

/** One career path: what it is, which courses it covers, and how far the player is. */
export function PathCard({ path }: { path: CareerPathSummary }) {
  const started = path.progressPercent > 0
  return (
    <Card className={cn('flex flex-col', path.recommended && 'border-[var(--color-accent)]')}>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold leading-snug">{path.title}</h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{path.tagline}</p>
          </div>
          <PathSprite name={path.sprite} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {path.recommended && path.reason && <Badge variant="accent">{path.reason}</Badge>}
          {path.enrolled && <Badge variant="violet">Your path</Badge>}
        </div>

        <ol className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[var(--color-text-muted)]">
          {path.courseTitles.map((title, i) => (
            <li key={title} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>→</span>}
              <span>{title}</span>
            </li>
          ))}
        </ol>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)]">
              {path.completedSteps} of {path.totalSteps} courses done
            </span>
            <span className="font-mono text-[var(--color-accent)]">{path.progressPercent}%</span>
          </div>
          <ProgressBar percent={path.progressPercent} className="mt-1.5" />
          <Link to={`/paths/${path.id}`} className={cn(buttonVariants({ variant: 'secondary' }), 'mt-4 w-full')}>
            {started || path.enrolled ? 'Open path' : 'Explore path'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
