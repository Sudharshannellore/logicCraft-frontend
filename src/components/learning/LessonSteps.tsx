import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { Lesson, TutorialImage } from '@/types'
import { buttonVariants } from '@/components/ui/Button'
import { Markdown } from '@/components/ui/Markdown'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { api } from '@/services/api'
import { HashTableDiagram } from './HashTableDiagram'
import { languageMeta } from './languages'
import { cn } from '@/utils/cn'

function SourceCredit({ lesson }: { lesson: Lesson }) {
  if (!lesson.liveSourceName) return null
  return (
    <p className="font-pixel text-xs text-[var(--color-text-muted)]">
      Source:{' '}
      {lesson.liveSourceUrl ? (
        <a href={lesson.liveSourceUrl} target="_blank" rel="noreferrer" className="text-[var(--color-accent)] underline-offset-4 hover:underline">
          {lesson.liveSourceName}
        </a>
      ) : (
        lesson.liveSourceName
      )}{' '}
      (open source, loaded live)
    </p>
  )
}

/** Diagrams for the concept, from Wikipedia. Shares its query with "Learn more", so it costs no extra request. */
function ConceptImages({ images }: { images: TutorialImage[] }) {
  return (
    <aside className="space-y-4 self-start">
      <p className="font-pixel text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Pictures</p>
      {images.map((image) => (
        <figure key={image.url} className="border-2 border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <img
            src={image.url}
            alt={image.caption ?? 'Diagram for this concept'}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.closest('figure')?.classList.add('hidden')
            }}
            className="mx-auto h-48 w-full bg-white/90 object-contain p-2"
          />
          <figcaption className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {image.caption && <span className="block text-[var(--color-text-primary)]">{image.caption}</span>}
            <a href={image.sourceUrl} target="_blank" rel="noreferrer" className="text-[var(--color-accent)] underline-offset-4 hover:underline">
              Image credit: Wikipedia
            </a>
          </figcaption>
        </figure>
      ))}
    </aside>
  )
}

/** The lesson text fills the width; when there are pictures they sit beside it, otherwise there is no empty column. */
export function StepConcept({ lesson }: { lesson: Lesson }) {
  const { data } = useQuery({
    queryKey: ['lesson-resources', lesson.id],
    queryFn: () => api.getLessonResources(lesson.id),
    staleTime: 30 * 60_000,
  })
  const images = data?.images ?? []
  return (
    <div className={images.length > 0 ? 'grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12' : ''}>
      <div className="min-w-0 space-y-7">
        {lesson.liveContent ? (
          <Markdown text={lesson.liveContent} className="text-base leading-8 text-[var(--color-text-primary)]" />
        ) : (
          <p className="text-lg leading-8 text-[var(--color-text-primary)] lg:text-xl lg:leading-9">{lesson.explanation}</p>
        )}
        <SourceCredit lesson={lesson} />
      </div>
      {images.length > 0 && <ConceptImages images={images} />}
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

    </div>
  )
}

/** A live lesson's practice: the syllabus exercise, graded on the practice exercise page. */
export function StepExercise({ lesson }: { lesson: Lesson }) {
  const exercise = lesson.exercise
  if (!exercise) return null
  return (
    <div className="max-w-2xl space-y-5">
      <p className="text-lg leading-8 text-[var(--color-text-primary)]">
        Put it to work with <span className="text-[var(--color-accent)]">{exercise.name}</span>, an open-source exercise with its own test suite.
      </p>
      {!exercise.gradable && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Tests for this language can't run on our servers yet, so you'll solve it in Exercism's free online editor.
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to={`/practice/exercism/${exercise.language}/${exercise.slug}`} className={buttonVariants({ variant: 'pixel', size: 'lg' })}>
          Open the exercise
        </Link>
        <a href={exercise.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'pixelDark', size: 'lg' })}>
          View on Exercism
        </a>
      </div>
      <p className="text-sm text-[var(--color-text-muted)]">Optional: you can finish the lesson now and come back to the exercise any time.</p>
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
        <Link
          to={
            lesson.exercise
              ? `/practice/exercism/${lesson.exercise.language}/${lesson.exercise.slug}`
              : lesson.courseId.startsWith('fw-')
                ? `/quiz/fwq-practice-${lesson.id}`
                : '/practice/two-sum'
          }
          className={cn(buttonVariants({ variant: 'pixel', size: 'lg' }), 'text-lg')}
        >
          {lesson.courseId.startsWith('fw-') ? 'Quiz yourself on this lesson' : 'Practice this concept'}
        </Link>
        <Link to={`/learn/${courseId}`} className={buttonVariants({ variant: 'pixelDark', size: 'lg' })}>
          Back to course
        </Link>
      </div>
    </div>
  )
}
