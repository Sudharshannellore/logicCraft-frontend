import { useQuery } from '@tanstack/react-query'
import { BookOpen, ExternalLink, MessagesSquare, PlayCircle, ScrollText } from 'lucide-react'
import type { TutorialResource } from '@/types'
import { api } from '@/services/api'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { cn } from '@/utils/cn'

const PROVIDERS: Record<string, string> = {
  devto: 'DEV Community',
  stackoverflow: 'Stack Overflow',
  mdn: 'MDN Web Docs',
  wikipedia: 'Wikipedia',
  youtube: 'YouTube',
}

const KIND: Record<TutorialResource['kind'], { label: string; Icon: typeof BookOpen }> = {
  article: { label: 'Article', Icon: ScrollText },
  qa: { label: 'Q&A', Icon: MessagesSquare },
  video: { label: 'Video', Icon: PlayCircle },
  reference: { label: 'Reference', Icon: BookOpen },
}

function ResourceLink({ resource }: { resource: TutorialResource }) {
  const { label, Icon } = KIND[resource.kind]
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 border-2 border-[var(--color-border)] bg-[var(--color-bg)] p-3 transition-colors hover:border-[var(--color-accent)]"
    >
      {resource.thumbnailUrl && resource.kind === 'video' ? (
        <img src={resource.thumbnailUrl} alt="" loading="lazy" className="h-14 w-24 shrink-0 object-cover" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--color-surface-elevated)] text-[var(--color-accent)]">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">{resource.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-pixel text-[11px] text-[var(--color-text-muted)]">
          <span>{PROVIDERS[resource.provider] ?? resource.provider}</span>
          <span>· {label}</span>
          {resource.readingMinutes ? <span>· {resource.readingMinutes} min read</span> : null}
          {resource.author ? <span className="truncate">· {resource.author}</span> : null}
        </span>
      </span>
      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]" />
    </a>
  )
}

/** "Learn more": live tutorials for this lesson from free platforms (DEV, Stack Overflow, MDN, Wikipedia, YouTube). */
export function LessonResources({ lessonId, className }: { lessonId: string; className?: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['lesson-resources', lessonId],
    queryFn: () => api.getLessonResources(lessonId),
    staleTime: 30 * 60_000,
  })

  return (
    <section aria-labelledby="learn-more" className={cn('border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 shadow-[4px_4px_0_var(--pixel-ink)]', className)}>
      <div className="mb-4 flex items-center gap-3">
        <PixelSprite sprite="treasureMap" scale={2} />
        <div>
          <h2 id="learn-more" className="text-lg">
            Learn more
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">Hand-picked from free tutorial sites — opens in a new tab.</p>
        </div>
      </div>

      {isLoading ? (
        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Loading tutorials">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="h-[66px] animate-pulse border-2 border-[var(--color-border)] bg-[var(--color-bg)]" />
          ))}
        </ul>
      ) : isError || !data ? (
        <p className="text-sm text-[var(--color-text-muted)]">Couldn't load tutorials right now — try again later.</p>
      ) : (
        <div className="space-y-4">
          {data.reference && (
            <a
              href={data.reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block border-l-4 border-[var(--color-violet)] bg-[var(--color-violet-soft)] p-4"
            >
              <p className="mb-1 flex items-center gap-2 font-pixel text-xs uppercase tracking-wider text-[var(--color-violet)]">
                <BookOpen className="h-3.5 w-3.5" /> {data.reference.title} · {PROVIDERS[data.reference.provider] ?? data.reference.provider}
              </p>
              <p className="line-clamp-4 text-sm leading-relaxed text-[var(--color-text-primary)]">{data.reference.summary}</p>
              <span className="mt-2 inline-flex items-center gap-1 font-pixel text-xs text-[var(--color-accent)] group-hover:underline">
                Read the full page <ExternalLink className="h-3 w-3" />
              </span>
            </a>
          )}
          {data.resources.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {data.resources.map((r) => (
                <li key={r.id}>
                  <ResourceLink resource={r} />
                </li>
              ))}
            </ul>
          ) : (
            !data.reference && <p className="text-sm text-[var(--color-text-muted)]">No tutorials found for this topic yet.</p>
          )}
        </div>
      )}
    </section>
  )
}
