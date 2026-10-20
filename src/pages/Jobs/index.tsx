import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, ChevronDown, ExternalLink, FileText, MapPin, Search } from 'lucide-react'
import type { ApplicationStatus, Job, JobApplication, JobEmployment, JobLevel } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Markdown } from '@/components/ui/Markdown'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { XpBalance } from '@/components/economy/EconomyBits'
import { ApplyDialog } from '@/components/jobs/ApplyDialog'
import { JobLogo } from '@/components/jobs/JobLogo'
import { LanguagePicker } from '@/components/learning/LanguagePicker'
import { ScaledResume } from '@/components/resume/ScaledResume'
import { PageLoader } from '@/components/layout/PageLoader'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { useResumeLibrary } from '@/stores/resumeStore'
import { RESUME_AI_COST } from '@/services/resumeAi'
import { APPLICATION_STATUSES, useApplications, useApplicationsStore } from '@/stores/applicationsStore'
import { cn } from '@/utils/cn'

const ALL = 'all'
const LEVELS = ['All', 'Intern', 'Junior', 'Mid-level', 'Senior'] as const satisfies readonly ('All' | JobLevel)[]
const TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'] as const satisfies readonly ('All' | JobEmployment)[]

const priceList = [
  { label: 'Tailor & match resume', cost: RESUME_AI_COST.tailor },
  { label: 'AI cover note', cost: RESUME_AI_COST.coverNote },
]

const posted = (days: number) => (days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`)

function FilterChips<T extends string>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={cn(
            'border-2 px-2.5 py-1 font-pixel text-xs transition-colors',
            value === o
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function JobListItem({ job, active, applied, onSelect }: { job: Job; active: boolean; applied: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex w-full items-start gap-3 border-2 p-3.5 text-left transition-colors',
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-elevated)]',
      )}
    >
      <JobLogo logo={job.logo} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('font-pixel text-[15px] leading-tight', active && 'text-[var(--color-accent)]')}>{job.role}</p>
          {applied && <Badge variant="success">Applied</Badge>}
        </div>
        <p className="mt-0.5 truncate text-sm text-[var(--color-text-secondary)]">{job.company}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {job.location}
          </span>
          {job.salary && <span>{job.salary}</span>}
          <span>{posted(job.postedDaysAgo)}</span>
          <span>{job.level}</span>
        </p>
      </div>
    </button>
  )
}

function JobDetail({ job, application, onApply, onBack }: { job: Job; application?: JobApplication; onApply: () => void; onBack: () => void }) {
  return (
    <article className="border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-[4px_4px_0_var(--pixel-ink)]">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 px-5 pt-4 font-pixel text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] lg:hidden">
        <ArrowLeft className="h-4 w-4" /> All roles
      </button>

      <header className="flex flex-wrap items-start gap-4 border-b-2 border-[var(--color-border)] p-5 sm:p-6">
        <JobLogo logo={job.logo} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl leading-tight">{job.role}</h2>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            {job.company} · {job.location}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="info">{job.workMode}</Badge>
            <Badge>{job.employment}</Badge>
            <Badge>{job.level}</Badge>
            {job.salary && <Badge variant="accent">{job.salary}</Badge>}
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Posted {posted(job.postedDaysAgo).toLowerCase()} on{' '}
            <a href={job.sourceUrl} target="_blank" rel="noopener" className="text-[var(--color-accent)] hover:underline">
              {job.source}
            </a>
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-end">
          {application ? (
            <>
              <Badge variant="success" className="justify-center px-3 py-1.5 text-sm">
                Applied {new Date(application.appliedAt).toLocaleDateString()}
              </Badge>
              <a href={job.applyUrl} target="_blank" rel="noopener" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'justify-center')}>
                <ExternalLink className="h-3.5 w-3.5" /> Open on {job.source}
              </a>
            </>
          ) : (
            <>
              <Button variant="pixel" size="lg" onClick={onApply}>
                Prepare & apply
              </Button>
              <span className="text-center text-xs text-[var(--color-text-muted)] sm:text-right">You apply on {job.source}. Tracking it here is free.</span>
            </>
          )}
        </div>
      </header>

      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <Markdown text={job.description || job.summary} />
        </div>

        <aside className="space-y-4">
          {job.tags.length > 0 && (
            <div>
              <h3 className="mb-2 text-base">Tech stack</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((t) => (
                  <span key={t} className="border-2 border-[var(--color-border-strong)] px-2 py-0.5 font-pixel text-xs text-[var(--color-text-secondary)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!application && (
            <div className="border-2 border-[var(--color-violet)]/40 bg-[var(--color-violet-soft)] p-3.5">
              <p className="flex items-center gap-2 font-pixel text-sm text-[var(--color-violet)]">
                <PixelSprite sprite="questBot" scale={1.5} /> Stand out
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                Before you apply, Quest AI can match your resume to this listing and tailor it for {job.company} ({RESUME_AI_COST.tailor} XP).
              </p>
            </div>
          )}
          <p className="text-xs text-[var(--color-text-muted)]">
            Listing from{' '}
            <a href={job.sourceUrl} target="_blank" rel="noopener" className="text-[var(--color-accent)] hover:underline">
              {job.source}
            </a>
            . Logicraft doesn't vet employers, so check the company before sharing personal details.
          </p>
        </aside>
      </div>
    </article>
  )
}

function ApplicationCard({ app }: { app: JobApplication }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setStatus = useApplicationsStore((s) => s.setStatus)
  const status = APPLICATION_STATUSES[app.status]
  const job = app.job

  return (
    <div className="border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-[4px_4px_0_var(--pixel-ink)]">
      <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
        {job ? <JobLogo logo={job.logo} /> : <JobLogo logo={{ sprite: 'briefcase', color: '#a78bfa' }} />}
        <div className="min-w-0 flex-1">
          <p className="font-pixel text-base">{job?.role ?? 'Listing no longer available'}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {job ? `${job.company} · ` : ''}applied {new Date(app.appliedAt).toLocaleDateString()}
            {job && (
              <>
                {' · '}
                <a href={job.applyUrl} target="_blank" rel="noopener" className="text-[var(--color-accent)] hover:underline">
                  {job.source}
                </a>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            <span className="sr-only">Status</span>
            <select
              value={app.status}
              aria-label="Update status"
              onChange={(e) => {
                setError(null)
                void setStatus(app.id, e.target.value as ApplicationStatus).catch((err) => setError(errorMessage(err)))
              }}
              className="border-2 bg-[var(--color-bg)] px-2 py-1 font-pixel text-xs outline-none focus:border-[var(--color-accent)]"
              style={{ borderColor: `var(--color-${status.tone === 'neutral' ? 'border-strong' : status.tone})`, color: `var(--color-${status.tone === 'neutral' ? 'text-secondary' : status.tone})` }}
            >
              {(Object.keys(APPLICATION_STATUSES) as ApplicationStatus[]).map((s) => (
                <option key={s} value={s}>
                  {APPLICATION_STATUSES[s].label}
                </option>
              ))}
            </select>
          </label>
          {app.tailored ? <Badge variant="violet">Tailored · {app.matchScore}% match</Badge> : <Badge>Resume as is</Badge>}
          {app.xpSpent > 0 && <Badge variant="accent">{app.xpSpent} XP on AI help</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <FileText className="h-3.5 w-3.5" /> What I prepared <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </Button>
      </div>
      {error && (
        <p role="alert" className="border-t-2 border-[var(--color-error)]/40 px-4 py-2 text-sm text-[var(--color-error)]">
          {error}
        </p>
      )}
      {open && (
        <div className="grid gap-5 border-t-2 border-[var(--color-border)] bg-[var(--color-bg)] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="mb-2 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              Resume{app.resumeTitle ? ` · ${app.resumeTitle}` : ''}
            </p>
            <ScaledResume data={app.resume} template={app.templateId} />
          </div>
          <div>
            <p className="mb-2 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Cover note</p>
            {app.coverNote ? (
              <p className="whitespace-pre-line border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">{app.coverNote}</p>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">No cover note.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Roles({ language, appliedByJob, onApply }: { language: string; appliedByJob: Map<string, JobApplication>; onApply: (job: Job) => void }) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['jobs', language],
    queryFn: () => api.getJobs(language === ALL ? undefined : language),
    staleTime: 10 * 60_000,
  })
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('All')
  const [type, setType] = useState<(typeof TYPES)[number]>('All')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data?.jobs ?? []).filter(
      (j) =>
        (level === 'All' || j.level === level) &&
        (type === 'All' || j.employment === type) &&
        (!q || [j.role, j.company, j.location, j.summary, ...j.tags].some((s) => s.toLowerCase().includes(q))),
    )
  }, [data, query, level, type])

  if (isLoading) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-16 text-center">
        <PixelSprite sprite="heroRun" scale={3} fps={8} />
        <p className="font-pixel text-sm uppercase tracking-widest text-[var(--color-accent)]">Fetching live listings…</p>
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 border-2 border-dashed border-[var(--color-border-strong)] py-16 text-center">
        <PixelSprite sprite="bugSlime" scale={4} fps={3} />
        <p className="text-sm text-[var(--color-text-secondary)]">{errorMessage(error)}</p>
        <Button onClick={() => void refetch()} disabled={isFetching}>
          Try again
        </Button>
      </div>
    )
  }

  const selected = filtered.find((j) => j.id === selectedId) ?? filtered[0]

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <span className="sr-only">Search roles</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Role, company, skill…"
            className="w-full border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] py-2 pl-9 pr-3 text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
          />
        </label>
        <FilterChips label="Level" options={LEVELS} value={level} onChange={setLevel} />
        <FilterChips label="Job type" options={TYPES} value={type} onChange={setType} />
      </div>

      {data.stale && (
        <p className="mb-4 flex items-center gap-2 border-2 border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-3 py-2 text-sm text-[var(--color-text-secondary)]">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--color-warning)]" /> A job board couldn't be reached just now, so some listings may be a few hours old.
        </p>
      )}

      {filtered.length === 0 || !selected ? (
        <div className="flex flex-col items-center gap-3 border-2 border-dashed border-[var(--color-border-strong)] py-16 text-center">
          <PixelSprite sprite="compass" scale={4} />
          <p className="font-pixel">{data.jobs.length ? 'No roles match those filters' : 'No open roles right now'}</p>
          {data.jobs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery('')
                setLevel('All')
                setType('All')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
          <div className={cn('space-y-2.5', showDetailOnMobile && 'hidden lg:block')}>
            <p className="font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">{filtered.length} open roles</p>
            {filtered.map((job) => (
              <JobListItem
                key={job.id}
                job={job}
                active={job.id === selected.id}
                applied={appliedByJob.has(job.id)}
                onSelect={() => {
                  setSelectedId(job.id)
                  setShowDetailOnMobile(true)
                  if (window.innerWidth < 1024) window.scrollTo({ top: 0 })
                }}
              />
            ))}
          </div>
          <div className={cn('lg:sticky lg:top-20 lg:self-start', !showDetailOnMobile && 'hidden lg:block')}>
            <JobDetail job={selected} application={appliedByJob.get(selected.id)} onApply={() => onApply(selected)} onBack={() => setShowDetailOnMobile(false)} />
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-[var(--color-text-muted)]">
        Live remote jobs from{' '}
        {data.sources.map((s, i) => (
          <span key={s.name}>
            {i > 0 && ' and '}
            <a href={s.url} target="_blank" rel="noopener" className="text-[var(--color-accent)] hover:underline">
              {s.name}
            </a>
          </span>
        ))}
        {data.updatedAt && `, updated ${new Date(data.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`}. Applications go
        through each board's own page.
      </p>
    </>
  )
}

export default function JobBoard() {
  const applications = useApplications()
  const resumesLoaded = useResumeLibrary()
  const { data: languages } = useQuery({ queryKey: ['library', 'languages'], queryFn: api.getLibraryLanguages, staleTime: 10 * 60_000 })
  const [params, setParams] = useSearchParams()
  const language = params.get('lang') ?? 'python'
  const [tab, setTab] = useState<'roles' | 'applications'>('roles')
  const [applying, setApplying] = useState<Job | null>(null)

  const appliedByJob = useMemo(() => new Map(applications.map((a) => [a.jobId, a])), [applications])

  if (!languages) return <PageLoader />

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <div className="pixel-corners flex h-16 w-16 shrink-0 items-center justify-center bg-[var(--color-accent-soft)]">
          <PixelSprite sprite="briefcase" scale={4} className="animate-pixel-hover" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl">Job Board</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Live remote developer jobs for the language you're learning. Let Quest AI tailor your resume, apply on the job board, and track it here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <XpBalance className="px-2 py-1.5 text-sm" />
          <Link to="/resume" className={buttonVariants({ variant: 'outline', size: 'md' })}>
            <PixelSprite sprite="resume" scale={1.5} /> Edit resume
          </Link>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-2 border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
        <span className="mr-1 flex items-center gap-1.5 font-pixel text-xs uppercase tracking-wider text-[var(--color-violet)]">
          <PixelSprite sprite="star" scale={1} /> XP prices
        </span>
        {priceList.map((p) => (
          <span key={p.label} className="border-2 border-[var(--color-border-strong)] px-2 py-0.5 font-pixel text-xs text-[var(--color-text-secondary)]">
            {p.label} <span className="text-[var(--color-accent)]">{p.cost} XP</span>
          </span>
        ))}
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">Browsing, applying and tracking are free.</span>
      </div>

      <div role="tablist" aria-label="Job board" className="mb-5 flex gap-1 border-b-2 border-[var(--color-border)]">
        {(
          [
            ['roles', 'Open roles'],
            ['applications', `My applications (${applications.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              '-mb-0.5 border-b-2 px-4 py-2 font-pixel text-sm transition-colors',
              tab === key ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'roles' ? (
        <>
          <LanguagePicker languages={languages} value={language} onChange={(id) => setParams({ lang: id }, { replace: true })} showExercises={false} allValue={ALL} />
          <Roles key={language} language={language} appliedByJob={appliedByJob} onApply={setApplying} />
        </>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border-2 border-dashed border-[var(--color-border-strong)] py-16 text-center">
          <PixelSprite sprite="briefcase" scale={5} className="animate-pixel-bob" />
          <p className="font-pixel text-lg">No applications yet</p>
          <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">Pick a role, tailor your resume with Quest AI, apply on the board, and keep track of it here.</p>
          <Button variant="pixel" onClick={() => setTab('roles')}>
            Browse roles
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}

      {applying && resumesLoaded && (
        <ApplyDialog
          job={applying}
          onClose={() => setApplying(null)}
          onViewApplications={() => {
            setApplying(null)
            setTab('applications')
          }}
        />
      )}
    </div>
  )
}
