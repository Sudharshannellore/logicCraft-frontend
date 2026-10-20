import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ExternalLink, Search } from 'lucide-react'
import { api } from '@/services/api'
import { Badge, difficultyVariant } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageLoader } from '@/components/layout/PageLoader'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { PixelBackdrop } from '@/components/pixel/PixelBackdrop'
import { LanguagePicker } from '@/components/learning/LanguagePicker'
import type { Difficulty, LibraryLanguage } from '@/types'
import { cn } from '@/utils/cn'
import { monsters } from './monsters'

type DifficultyFilter = 'all' | Difficulty

const difficultyFilters: { id: DifficultyFilter; label: string }[] = [
  { id: 'all', label: 'Any' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
]

const PAGE = 40

interface Row {
  key: string
  title: string
  difficulty: Difficulty
  xp: number
  tags: string[]
  to: string
  solved?: boolean
  /** Shown instead of an acceptance rate. */
  meta?: string
  external?: boolean
}

function FilterTabs<T extends string>({ label, options, value, onChange }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={label}>
      {options.map((f) => {
        const isActive = value === f.id
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(f.id)}
            className={cn(
              'border-2 px-3.5 py-1.5 font-pixel text-sm uppercase tracking-wider transition-transform duration-75',
              isActive
                ? '-translate-y-0.5 border-[var(--color-accent)] bg-[var(--color-accent)] text-[#06120a] shadow-[3px_3px_0_var(--pixel-ink)]'
                : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:-translate-y-0.5 hover:text-[var(--color-text-primary)] hover:shadow-[3px_3px_0_var(--pixel-ink)]',
            )}
          >
            {f.label}
          </button>
        )
      })}
    </div>
  )
}

function ProblemRows({ rows, metaLabel }: { rows: Row[]; metaLabel: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="hidden grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b-2 border-[var(--color-border)] px-5 py-3 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)] sm:grid">
        <span className="w-12">Foe</span>
        <span>Question</span>
        <span className="w-24 text-center">Reward</span>
        <span className="w-28 text-center">{metaLabel}</span>
        <span className="w-8" />
      </div>
      <div className="divide-y-2 divide-[var(--color-border)]">
        {rows.map((row) => {
          const monster = monsters[row.difficulty]
          return (
            <Link
              key={row.key}
              to={row.to}
              className="group grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 px-5 py-4 text-sm transition-[transform,background-color] duration-100 hover:-translate-y-0.5 hover:bg-[var(--color-surface-elevated)] sm:grid-cols-[auto_1fr_auto_auto_auto]"
            >
              <div
                className="pixel-corners row-span-2 flex h-12 w-12 shrink-0 items-end justify-center pb-1 sm:row-span-1"
                style={{ backgroundColor: `color-mix(in srgb, ${monster.color} 14%, transparent)` }}
              >
                <PixelSprite sprite={monster.sprite} scale={monster.scale} fps={monster.fps} className="group-hover:animate-pixel-bob" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--color-text-primary)]">{row.title}</span>
                  <Badge variant={difficultyVariant(row.difficulty)} className="capitalize">
                    {row.difficulty}
                  </Badge>
                  {row.solved && <Badge variant="success">Solved</Badge>}
                  {row.external && (
                    <Badge variant="neutral">
                      <ExternalLink className="h-3 w-3" /> Exercism
                    </Badge>
                  )}
                </div>
                {row.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {row.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-xs text-[var(--color-text-muted)]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-start-2 flex items-center gap-4 sm:contents">
                <span className="flex items-center gap-1.5 font-pixel text-sm text-[var(--color-warning)] sm:w-24 sm:justify-center">
                  {row.external ? <span className="text-[var(--color-text-muted)]">—</span> : <><PixelSprite sprite="star" scale={1.25} />+{row.xp} XP</>}
                </span>
                <span className="font-pixel text-sm text-[var(--color-text-secondary)] sm:w-28 sm:text-center">{row.meta}</span>
                <ChevronRight className="hidden h-4 w-4 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)] sm:block" />
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}

/** Logicraft's own hand-written problems: coding problems (Python/JavaScript) and SQL questions. */
function Originals({ language }: { language: string }) {
  const isSql = language === 'sql'
  const coding = language === 'python' || language === 'javascript'
  const { data: problems } = useQuery({ queryKey: ['problems'], queryFn: api.getProblems, enabled: coding })
  const { data: sqlProblems } = useQuery({ queryKey: ['sql-problems'], queryFn: api.getSqlProblems, enabled: isSql })
  const rows: Row[] = isSql
    ? (sqlProblems ?? []).map((p) => ({ key: p.id, title: p.title, difficulty: p.difficulty, xp: p.xp, tags: p.tags, to: `/practice/sql/${p.slug}`, solved: p.solved, meta: `${p.acceptanceRate}%` }))
    : coding
      ? (problems ?? []).map((p) => ({ key: p.id, title: p.title, difficulty: p.difficulty, xp: p.xp, tags: p.tags, to: `/practice/${p.slug}`, solved: p.solved, meta: `${p.acceptanceRate}%` }))
      : []
  if (!rows.length) return null
  return (
    <section className="mb-8" aria-labelledby="originals">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="originals" className="text-lg">
          Logicraft originals
        </h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          {isSql ? 'Graded on our practice database' : 'Python & JavaScript · used for friend duels'}
        </span>
      </div>
      <ProblemRows rows={rows} metaLabel="Acceptance" />
    </section>
  )
}

function Library({ language }: { language: LibraryLanguage }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['library', language.id],
    queryFn: () => api.getLibraryExercises(language.id),
    staleTime: 10 * 60_000,
  })
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all')
  const [query, setQuery] = useState('')
  const [shown, setShown] = useState(PAGE)

  const filterBy = (next: DifficultyFilter) => {
    setDifficulty(next)
    setShown(PAGE)
  }

  const rows = useMemo<Row[]>(() => {
    const needle = query.trim().toLowerCase()
    return (data?.exercises ?? [])
      .filter((e) => (difficulty === 'all' || e.difficulty === difficulty) && (!needle || e.name.toLowerCase().includes(needle) || e.topics.some((t) => t.includes(needle))))
      .map((e) => ({
        key: e.slug,
        title: e.name,
        difficulty: e.difficulty,
        xp: e.xp,
        tags: e.topics,
        to: `/practice/exercism/${language.id}/${e.slug}`,
        solved: e.solved,
        meta: `Lv ${e.level}/10`,
        external: !language.gradable,
      }))
  }, [data, difficulty, query, language])

  return (
    <section aria-labelledby="library">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="library" className="text-lg">
          {language.name} exercise library
        </h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          Live from{' '}
          <a href={data?.sourceUrl ?? 'https://exercism.org'} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">
            Exercism
          </a>{' '}
          · open source (MIT)
        </span>
      </div>

      <div
        className={cn(
          'mb-4 flex items-start gap-3 border-2 p-3 text-sm',
          language.gradable ? 'border-[var(--color-success)]/40 bg-[var(--color-success)]/5' : 'border-[var(--color-info)]/40 bg-[var(--color-info)]/10',
        )}
      >
        <PixelSprite sprite={language.gradable ? 'trophy' : 'compass'} scale={2} />
        <p className="text-[var(--color-text-secondary)]">
          {language.gradable ? (
            <>Solve them here: your code runs against each exercise's official test suite, and your first pass earns XP.</>
          ) : (
            <>
              Read each exercise and its tests here, then solve it in Exercism's free online editor — {language.name} tests don't run on this server yet.
            </>
          )}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <FilterTabs label="Filter by difficulty" options={difficultyFilters} value={difficulty} onChange={filterBy} />
        <label className="flex min-w-[220px] flex-1 items-center gap-2 border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 focus-within:border-[var(--color-accent)]">
          <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShown(PAGE)
            }}
            placeholder="Search by name or topic…"
            aria-label="Search exercises"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-[72px] animate-pulse border-2 border-[var(--color-border)] bg-[var(--color-surface)]" />
          ))}
        </div>
      ) : isError ? (
        <p className="border-2 border-[var(--color-error)]/40 bg-[var(--color-error)]/10 p-4 text-sm">
          Couldn't load the {language.name} exercises from Exercism right now. Try again in a minute.
        </p>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-text-secondary)]">No exercises match those filters.</p>
      ) : (
        <>
          <ProblemRows rows={rows.slice(0, shown)} metaLabel="Level" />
          {rows.length > shown && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShown((n) => n + PAGE)}
                className="border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 font-pixel text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Show more ({rows.length - shown} left)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default function Practice() {
  const { data: languages } = useQuery({ queryKey: ['library', 'languages'], queryFn: api.getLibraryLanguages, staleTime: 10 * 60_000 })
  const [params, setParams] = useSearchParams()
  const selected = params.get('lang') ?? 'python'

  if (!languages) return <PageLoader />
  const language = languages.find((l) => l.id === selected) ?? languages[0]
  const total = languages.reduce((sum, l) => sum + (l.exerciseCount ?? 0), 0)

  return (
    <>
      <PixelBackdrop scene="dungeon" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="pixel-corners flex h-16 w-16 shrink-0 items-center justify-center bg-[var(--color-accent-soft)]">
            <PixelSprite sprite="terminal" scale={3} fps={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">Practice</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {total.toLocaleString()} exercises across {languages.length} languages, each a monster to defeat.
            </p>
          </div>
          <Link
            to="/sql"
            className="flex items-center gap-2 border-2 border-[var(--color-info)]/40 bg-[var(--color-surface)] px-3 py-2 font-pixel text-sm text-[var(--color-info)] shadow-[3px_3px_0_var(--pixel-ink)] transition-transform hover:-translate-y-0.5"
          >
            <PixelSprite sprite="database" scale={1.5} /> SQL Sandbox
          </Link>
        </div>

        <LanguagePicker languages={languages} value={language.id} onChange={(id) => setParams({ lang: id }, { replace: true })} />
        <p className="-mt-3 mb-6 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-[var(--color-success)]" /> Tests run here
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-[var(--color-text-muted)]" /> Tests run on Exercism
          </span>
        </p>

        <Originals language={language.id} />
        <Library key={language.id} language={language} />
      </div>
    </>
  )
}
