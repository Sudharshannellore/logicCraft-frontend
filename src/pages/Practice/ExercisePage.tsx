import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { buttonVariants } from '@/components/ui/Button'
import { PageLoader } from '@/components/layout/PageLoader'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { ExerciseWorkspace } from '@/components/practice/ExerciseWorkspace'

export default function ExercisePage() {
  const { language = '', slug = '' } = useParams<{ language: string; slug: string }>()
  const { data: exercise, isLoading, isError, error } = useQuery({
    queryKey: ['library-exercise', language, slug],
    queryFn: () => api.getLibraryExercise(language, slug),
    staleTime: 10 * 60_000,
  })

  if (isLoading) return <PageLoader />

  if (!exercise) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <PixelSprite sprite="bugSlime" scale={5} fps={3} className="animate-pixel-bob" />
        <h1 className="text-xl font-bold">{isError ? "Couldn't load this exercise" : 'Exercise not found'}</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">{isError ? errorMessage(error) : `There's no "${slug}" exercise for ${language}.`}</p>
        <Link to={`/practice?lang=${language}`} className={buttonVariants()}>
          Back to Practice
        </Link>
      </div>
    )
  }

  return (
    <ExerciseWorkspace
      key={`${language}/${slug}`}
      exercise={exercise}
      backHref={`/practice?lang=${exercise.language.id}`}
      backLabel="Back to Practice"
    />
  )
}
