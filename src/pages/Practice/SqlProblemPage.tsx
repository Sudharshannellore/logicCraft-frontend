import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge, difficultyVariant } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { PageLoader } from '@/components/layout/PageLoader'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { PixelBackdrop } from '@/components/pixel/PixelBackdrop'
import { SqlBoard } from '@/components/sql/SqlBoard'
import { VictoryOverlay } from '@/components/gamification/VictoryOverlay'
import { RichText } from '@/components/ui/RichText'
import { monsters } from './monsters'

export default function SqlProblemPage() {
  const { sqlProblemId = '' } = useParams<{ sqlProblemId: string }>()
  const { data: problem, isLoading } = useQuery({ queryKey: ['sql-problem', sqlProblemId], queryFn: () => api.getSqlProblem(sqlProblemId) })
  const { data: tables } = useQuery({ queryKey: ['sql-tables'], queryFn: api.getSqlTables })
  const [hintsShown, setHintsShown] = useState(0)
  const [victoryOpen, setVictoryOpen] = useState(false)
  const [awardedXp, setAwardedXp] = useState(0)
  const queryClient = useQueryClient()

  if (isLoading || !tables) return <PageLoader />

  if (!problem) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <PixelSprite sprite="bugSlime" scale={5} fps={3} className="animate-pixel-bob" />
        <h1 className="text-xl font-bold">SQL question not found</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">We couldn't find a SQL question called "{sqlProblemId}".</p>
        <Link to="/practice" className={buttonVariants()}>
          Back to Practice
        </Link>
      </div>
    )
  }

  const monster = monsters[problem.difficulty]

  return (
    <>
      <PixelBackdrop scene="vault" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Link to="/practice" className="mb-4 inline-flex items-center gap-1.5 font-pixel text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Practice
        </Link>

        <Card className="mb-6">
          <CardContent className="grid gap-5 md:grid-cols-[auto_1fr_280px]">
            <div
              className="pixel-corners flex h-20 w-20 items-end justify-center pb-2"
              style={{ backgroundColor: `color-mix(in srgb, ${monster.color} 14%, transparent)` }}
            >
              <PixelSprite sprite={monster.sprite} scale={monster.scale * 1.4} fps={3} className="animate-pixel-bob" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">
                  <PixelSprite sprite="database" scale={1} /> SQL
                </Badge>
                <h1 className="text-2xl font-bold">{problem.title}</h1>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={difficultyVariant(problem.difficulty)} className="capitalize">
                  {problem.difficulty}
                </Badge>
                <Badge variant="warning">
                  <PixelSprite sprite="star" scale={1} /> +{problem.xp} XP
                </Badge>
                <Badge>{problem.acceptanceRate}% acceptance</Badge>
                {problem.tags.map((tag) => (
                  <span key={tag} className="text-xs text-[var(--color-text-muted)]">
                    #{tag}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                <RichText text={problem.description} />
              </p>
              <p className="mt-3 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Tables:{' '}
                {problem.tablesUsed.map((t) => (
                  <span key={t} className="ml-1 border-2 border-[var(--color-warning)]/40 px-1.5 font-mono normal-case text-[var(--color-warning)]">
                    {t}
                  </span>
                ))}
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Hints</p>
              {problem.hints.slice(0, hintsShown).map((hint, i) => (
                <div key={i} className="flex gap-2 border-2 border-[var(--color-violet)]/30 bg-[var(--color-violet-soft)] p-2 text-xs text-[var(--color-text-primary)]">
                  <PixelSprite sprite="scroll" scale={1.5} />
                  {hint}
                </div>
              ))}
              {hintsShown < problem.hints.length && (
                <button
                  type="button"
                  onClick={() => setHintsShown((n) => n + 1)}
                  className="group flex w-full items-center gap-2 border-2 border-dashed border-[var(--color-border-strong)] px-2 py-1.5 font-pixel text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-violet)] hover:text-[var(--color-violet)]"
                >
                  <PixelSprite sprite="potion" scale={1.5} className="group-hover:animate-pixel-bob" />
                  Reveal hint {hintsShown + 1}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <SqlBoard key={problem.id} tables={tables} problem={problem} onSolved={(awarded) => {
            setAwardedXp(awarded)
            void queryClient.invalidateQueries({ queryKey: ['sql-problems'] })
            void queryClient.invalidateQueries({ queryKey: ['daily-quest'] })
            setVictoryOpen(true)
          }} />
      </div>

      <VictoryOverlay
        open={victoryOpen}
        xp={problem.xp}
        awardedXp={awardedXp}
        title={`${problem.title} solved — query accepted`}
        onClose={() => setVictoryOpen(false)}
      />
    </>
  )
}
