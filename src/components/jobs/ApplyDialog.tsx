import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Copy, ExternalLink, Plus, X } from 'lucide-react'
import type { Job, ResumeData, TailorResult } from '@/types'
import { Button } from '@/components/ui/Button'
import { Confetti } from '@/components/ui/Confetti'
import { PixelBar } from '@/components/pixel/PixelBar'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { XpBalance } from '@/components/economy/EconomyBits'
import { AiButton } from '@/components/resume/AiButton'
import { ScaledResume } from '@/components/resume/ScaledResume'
import { JobLogo } from './JobLogo'
import { templateName, useResumeTemplates } from '@/components/resume/templates'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { applyTailoring, jobText, matchJob, RESUME_AI_COST } from '@/services/resumeAi'
import { useResumeStore } from '@/stores/resumeStore'
import { useApplicationsStore } from '@/stores/applicationsStore'
import { useWalletStore } from '@/stores/walletStore'
import { cn } from '@/utils/cn'

const STEPS = ['Resume', 'Cover note', 'Apply'] as const

const PLACEHOLDER = /\[[^\]]+\]/g

function countPlaceholders(resume: ResumeData, coverNote: string) {
  const text = [resume.summary, coverNote, ...[...resume.experience, ...resume.projects].flatMap((e) => e.bullets)].join('\n')
  return text.match(PLACEHOLDER)?.length ?? 0
}

function Chip({ children, tone }: { children: ReactNode; tone: 'success' | 'warning' }) {
  return (
    <span
      className={cn(
        'border-2 px-1.5 font-pixel text-[11px]',
        tone === 'success' ? 'border-[var(--color-success)]/40 text-[var(--color-success)]' : 'border-[var(--color-warning)]/40 text-[var(--color-warning)]',
      )}
    >
      {children}
    </span>
  )
}

function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-violet)]" />
      <span>{children}</span>
    </label>
  )
}

interface ApplyDialogProps {
  job: Job
  onClose: () => void
  /** Called from the success screen to jump to the applications list. */
  onViewApplications: () => void
}

/**
 * Three-step flow: optionally tailor the resume (XP), optionally write a cover note (XP), then apply on the job
 * board's own page. The application is tracked under My applications (free).
 */
export function ApplyDialog({ job, onClose, onViewApplications }: ApplyDialogProps) {
  const templates = useResumeTemplates()
  const resumes = useResumeStore((s) => s.resumes)
  const activeId = useResumeStore((s) => s.activeId)
  const updateResume = useResumeStore((s) => s.updateById)
  const track = useApplicationsStore((s) => s.track)
  const setBalance = useWalletStore((s) => s.setBalance)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Tailoring changes only this application's copy of the chosen resume.
  const [chosenId, setChosenId] = useState(activeId)
  const chosen = resumes.find((r) => r.id === chosenId) ?? resumes[0]
  const base = chosen.data
  const description = useMemo(() => jobText(job), [job])
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [tailor, setTailor] = useState<TailorResult | null>(null)
  const [useSummary, setUseSummary] = useState(true)
  const [confirmedSkills, setConfirmedSkills] = useState<string[]>([])
  const [saveToMain, setSaveToMain] = useState(false)
  const [coverNote, setCoverNote] = useState('')
  const [aiSpent, setAiSpent] = useState(0)
  const [confirmClose, setConfirmClose] = useState(false)
  const panel = useRef<HTMLDivElement>(null)

  const resume = useMemo(() => {
    if (!tailor) return base
    const withSkills = { ...base, skills: [...base.skills, ...confirmedSkills.filter((s) => !base.skills.includes(s))] }
    const tailored = applyTailoring(withSkills, { ...tailor, matched: matchJob(withSkills, description).matched })
    return useSummary ? tailored : { ...tailored, summary: base.summary }
  }, [base, tailor, confirmedSkills, useSummary, description])

  const liveMatch = tailor ? matchJob(resume, description) : null
  const placeholders = countPlaceholders(resume, coverNote)

  const requestClose = () => {
    if (aiSpent > 0 && !done) setConfirmClose(true)
    else onClose()
  }

  useEffect(() => {
    panel.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const submit = async () => {
    // Opened right away (inside the click) so the browser doesn't block it; the boards' terms ask that
    // every Apply goes to their own link.
    window.open(job.applyUrl, '_blank', 'noopener')
    setSubmitting(true)
    setSubmitError(null)
    try {
      await track(job.id, {
        resumeId: chosen.id,
        // The tailored copy is this application's own; otherwise the saved resume as it is.
        resume: tailor ? resume : undefined,
        coverNote: coverNote.trim(),
        tailored: !!tailor,
        aiXpSpent: aiSpent,
      })
      if (saveToMain && tailor) updateResume(chosen.id, () => resume)
      setDone(true)
    } catch (e) {
      setSubmitError(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  const preview = (
    <>
      <p className="mb-2 flex items-center justify-between font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
        Resume {job.company} will see
        {tailor && <span className="text-[var(--color-violet)] normal-case tracking-normal">Tailored</span>}
      </p>
      <ScaledResume data={resume} template={chosen.templateId} paperClassName="shadow-[0_6px_24px_rgba(0,0,0,0.5)]" />
    </>
  )

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Apply to ${job.role} at ${job.company}`}
        tabIndex={-1}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="flex h-full w-full max-w-6xl flex-col border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-[6px_6px_0_var(--pixel-ink)] outline-none sm:h-[min(92dvh,920px)]"
      >
        <header className="flex items-center gap-3 border-b-2 border-[var(--color-border)] px-4 py-3 sm:px-6">
          <JobLogo logo={job.logo} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-pixel text-base sm:text-lg">{job.role}</p>
            <p className="truncate text-xs text-[var(--color-text-secondary)]">
              {job.company} · {job.location}
            </p>
          </div>
          <XpBalance className="hidden px-2 py-1 text-sm sm:inline-flex" />
          <button type="button" onClick={requestClose} aria-label="Close" className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <X className="h-5 w-5" />
          </button>
        </header>

        {done ? (
          <div className="relative flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden px-6 text-center">
            <Confetti fire count={36} />
            <PixelSprite sprite="chestOpened" scale={6} className="animate-pixel-bob" />
            <h2 className="text-2xl sm:text-3xl">Finish on {job.source}</h2>
            <p className="max-w-md text-sm text-[var(--color-text-secondary)]">
              {job.source} opened in a new tab: complete your application to {job.company} there. It's saved under My applications with the{' '}
              {tailor ? 'tailored ' : ''}resume{coverNote.trim() ? ' and cover note' : ''} you prepared, so you can update its status as you hear back.
            </p>
            <a href={job.applyUrl} target="_blank" rel="noopener" className="text-sm text-[var(--color-accent)] hover:underline">
              Tab didn't open? Go to the application <ExternalLink className="inline h-3.5 w-3.5" />
            </a>
            {saveToMain && tailor && <p className="text-xs text-[var(--color-violet)]">The tailored changes were also saved to “{chosen.title}”.</p>}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Button variant="pixelViolet" onClick={onViewApplications}>
                View my applications
              </Button>
              <Button variant="outline" onClick={onClose}>
                Keep browsing
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ol className="flex gap-1 border-b-2 border-[var(--color-border)] px-4 py-2.5 sm:gap-2 sm:px-6" aria-label="Steps">
              {STEPS.map((label, i) => (
                <li key={label} className="flex min-w-0 items-center gap-1 sm:gap-2">
                  {i > 0 && <span className="h-0.5 w-3 shrink-0 bg-[var(--color-border-strong)] sm:w-8" aria-hidden="true" />}
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    aria-current={step === i ? 'step' : undefined}
                    className={cn(
                      'flex min-w-0 items-center gap-2 font-pixel text-xs sm:text-sm',
                      step === i ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center border-2 text-[11px]',
                        step === i
                          ? 'border-[var(--color-violet)] bg-[var(--color-violet)] text-[#140b2e]'
                          : i < step
                            ? 'border-[var(--color-violet)] text-[var(--color-violet)]'
                            : 'border-[var(--color-border-strong)]',
                      )}
                    >
                      {i < step ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className={cn('truncate', step !== i && 'hidden sm:inline')}>{label}</span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_400px]">
              <div className="pixel-scroll min-h-0 space-y-5 overflow-y-auto p-4 sm:p-6">
                {step === 0 && (
                  <>
                    <div>
                      <h2 className="text-xl">Your resume for this job</h2>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        Get the resume you'll send from the{' '}
                        <Link to="/resume" className="text-[var(--color-accent)] hover:underline">
                          Resume Builder
                        </Link>
                        . Tailoring it to {job.company} is optional, but it helps you stand out.
                      </p>
                    </div>

                    {resumes.length > 1 && (
                      <label className="block">
                        <span className="mb-1 block font-pixel text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">Resume to use</span>
                        <select
                          value={chosen.id}
                          disabled={!!tailor}
                          onChange={(e) => setChosenId(e.target.value)}
                          className="w-full border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2 font-pixel text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] disabled:opacity-60"
                        >
                          {resumes.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title} · {templateName(templates, r.templateId)} template
                            </option>
                          ))}
                        </select>
                        {tailor && <span className="mt-1 block text-xs text-[var(--color-text-muted)]">Locked after tailoring — the match was made for this resume.</span>}
                      </label>
                    )}

                    <section className="space-y-4 border-2 border-[var(--color-violet)]/50 bg-[var(--color-violet-soft)] p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-[min(100%,260px)] flex-1">
                          <h3 className="flex items-center gap-2 text-base">
                            <PixelSprite sprite="compass" scale={2} /> Tailor & match
                          </h3>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            Quest AI checks your resume against this job's requirements, rewrites your summary for the role and lists the skills they ask for first. It never adds anything you haven't confirmed.
                          </p>
                        </div>
                        {tailor ? (
                          <span className="inline-flex items-center gap-1 font-pixel text-xs text-[var(--color-violet)]">
                            <Check className="h-3.5 w-3.5" /> Tailored
                          </span>
                        ) : (
                          <AiButton
                            label="Tailor & match"
                            cost={RESUME_AI_COST.tailor}
                            onRun={async () => {
                              const { result, balance } = await api.tailorResume(base, { jobId: job.id })
                              setBalance(balance)
                              setTailor(result)
                              setAiSpent((s) => s + RESUME_AI_COST.tailor)
                            }}
                          />
                        )}
                      </div>

                      {tailor && liveMatch && (
                        <div className="space-y-4">
                          <div>
                            <div className="mb-1.5 flex items-center justify-between font-pixel text-sm">
                              <span>Keyword match</span>
                              <span className={liveMatch.score >= 70 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}>
                                {liveMatch.score !== tailor.score && <span className="mr-1.5 text-[var(--color-text-muted)] line-through">{tailor.score}%</span>}
                                {liveMatch.score}%
                              </span>
                            </div>
                            <PixelBar percent={liveMatch.score} segments={20} color={liveMatch.score >= 70 ? 'accent' : 'warning'} label="Job keyword match" />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <p className="mb-1.5 font-pixel text-xs uppercase tracking-wider text-[var(--color-success)]">On your resume</p>
                              <div className="flex flex-wrap gap-1.5">
                                {liveMatch.matched.length ? (
                                  liveMatch.matched.map((k) => (
                                    <Chip key={k} tone="success">
                                      {k}
                                    </Chip>
                                  ))
                                ) : (
                                  <span className="text-xs text-[var(--color-text-muted)]">None yet</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="mb-1.5 font-pixel text-xs uppercase tracking-wider text-[var(--color-warning)]">They also want</p>
                              {tailor.missing.length ? (
                                <>
                                  <div className="flex flex-wrap gap-1.5">
                                    {tailor.missing.map((k) => {
                                      const on = confirmedSkills.includes(k)
                                      return (
                                        <button
                                          key={k}
                                          type="button"
                                          aria-pressed={on}
                                          onClick={() => setConfirmedSkills((s) => (on ? s.filter((x) => x !== k) : [...s, k]))}
                                          className={cn(
                                            'inline-flex items-center gap-1 border-2 px-1.5 font-pixel text-[11px] transition-colors',
                                            on
                                              ? 'border-[var(--color-success)] bg-[var(--color-success)]/15 text-[var(--color-success)]'
                                              : 'border-dashed border-[var(--color-warning)]/60 text-[var(--color-warning)] hover:border-solid',
                                          )}
                                        >
                                          {on ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />} {k}
                                        </button>
                                      )
                                    })}
                                  </div>
                                  <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">Tap a skill you genuinely have to add it. Interviewers will ask about it.</p>
                                </>
                              ) : (
                                <span className="text-xs text-[var(--color-text-muted)]">Nothing — great fit!</span>
                              )}
                            </div>
                          </div>

                          <div className="border-t-2 border-[var(--color-violet)]/25 pt-4">
                            <p className="mb-1.5 font-pixel text-xs uppercase tracking-wider text-[var(--color-violet)]">Summary for this role</p>
                            <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">{tailor.summary}</p>
                            <div className="mt-3 space-y-2">
                              <CheckRow checked={useSummary} onChange={setUseSummary}>
                                Use this summary in this application
                              </CheckRow>
                              <CheckRow checked={saveToMain} onChange={setSaveToMain}>
                                Also save these changes to “{chosen.title}” (so you can download it as a PDF)
                              </CheckRow>
                            </div>
                          </div>
                        </div>
                      )}
                    </section>

                    {!tailor && <p className="text-xs text-[var(--color-text-muted)]">Not now? Skip ahead and use your resume as it is.</p>}

                    <details className="lg:hidden">
                      <summary className="cursor-pointer font-pixel text-sm text-[var(--color-accent)]">Preview the resume</summary>
                      <div className="mt-3">{preview}</div>
                    </details>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-[min(100%,260px)] flex-1">
                        <h2 className="text-xl">Cover note</h2>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Optional. A few honest lines about why {job.company} — writing it yourself is free.</p>
                      </div>
                      <AiButton
                        label={coverNote.trim() ? 'Rewrite with AI' : 'Write cover note'}
                        cost={RESUME_AI_COST.coverNote}
                        onRun={async () => {
                          const { text, balance } = await api.writeCoverNote(resume, job.id)
                          setBalance(balance)
                          setCoverNote(text)
                          setAiSpent((s) => s + RESUME_AI_COST.coverNote)
                        }}
                      />
                    </div>
                    <textarea
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      rows={14}
                      aria-label="Cover note"
                      placeholder={`Dear ${job.company} hiring team, …`}
                      className="w-full resize-y border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2.5 text-sm leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-violet)]"
                    />
                    <p className="flex flex-wrap justify-between gap-2 text-xs text-[var(--color-text-muted)]">
                      <span>Quest AI leaves [brackets] for things only you know — replace them before you apply.</span>
                      <span>{coverNote.trim() ? coverNote.trim().split(/\s+/).length : 0} words</span>
                    </p>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="text-xl">Apply on {job.source}</h2>
                    <dl className="divide-y-2 divide-[var(--color-border)] border-2 border-[var(--color-border)]">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <dt className="font-pixel text-sm text-[var(--color-text-secondary)]">Resume</dt>
                        <dd className="text-sm">
                          {tailor && liveMatch ? (
                            <span>
                              Tailored for {job.company} · <span className="font-pixel text-[var(--color-success)]">{liveMatch.score}% match</span>
                            </span>
                          ) : (
                            <span className="text-[var(--color-text-secondary)]">As it is — not checked against this job</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <dt className="font-pixel text-sm text-[var(--color-text-secondary)]">Cover note</dt>
                        <dd className="flex items-center gap-2 text-sm">
                          {coverNote.trim() ? (
                            <>
                              {coverNote.trim().split(/\s+/).length} words
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  void navigator.clipboard?.writeText(coverNote.trim()).then(() => setCopied(true))
                                }}
                              >
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
                              </Button>
                            </>
                          ) : (
                            <span className="text-[var(--color-text-secondary)]">None</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <dt className="font-pixel text-sm text-[var(--color-text-secondary)]">Quest AI help</dt>
                        <dd className="text-sm">{aiSpent ? `${aiSpent} XP (already paid)` : 'None'} · applying is free</dd>
                      </div>
                    </dl>

                    {placeholders > 0 && (
                      <div className="flex items-start gap-3 border-2 border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" />
                        <p className="text-[var(--color-text-secondary)]">
                          <span className="font-pixel text-[var(--color-warning)]">
                            {placeholders} [placeholder]{placeholders > 1 ? 's' : ''} still to fill.
                          </span>{' '}
                          Replace them in the cover note{' '}
                          <button type="button" onClick={() => setStep(1)} className="text-[var(--color-accent)] hover:underline">
                            here
                          </button>{' '}
                          or in your resume bullets in the{' '}
                          <Link to="/resume" className="text-[var(--color-accent)] hover:underline">
                            Resume Builder
                          </Link>{' '}
                          before applying.
                        </p>
                      </div>
                    )}

                    <ol className="list-decimal space-y-1.5 border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] p-4 pl-8 text-sm text-[var(--color-text-secondary)]">
                      <li>
                        Get your resume as a PDF with <span className="font-pixel">Download PDF</span> in the{' '}
                        <Link to="/resume" className="text-[var(--color-accent)] hover:underline">
                          Resume Builder
                        </Link>
                        {tailor ? (saveToMain ? ' (the tailored changes are saved there when you apply).' : '. Tick "Also save these changes" in step 1 to include the tailoring.') : '.'}
                      </li>
                      {coverNote.trim() && <li>Copy your cover note.</li>}
                      <li>Apply on this job's page on {job.source}. Logicraft doesn't send anything to {job.company}; it keeps a record under My applications.</li>
                    </ol>

                    <details className="lg:hidden">
                      <summary className="cursor-pointer font-pixel text-sm text-[var(--color-accent)]">Preview the resume</summary>
                      <div className="mt-3">{preview}</div>
                    </details>
                  </>
                )}
              </div>

              <aside className="pixel-scroll hidden min-h-0 overflow-y-auto border-l-2 border-[var(--color-border)] bg-[var(--color-bg)] p-5 lg:block">{preview}</aside>
            </div>

            <footer className="border-t-2 border-[var(--color-border)] px-4 py-3 sm:px-6">
              {confirmClose ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--color-warning)]">Leave without applying? The {aiSpent} XP spent on AI help here won't be refunded.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setConfirmClose(false)}>
                      Stay
                    </Button>
                    <Button variant="danger" size="sm" onClick={onClose}>
                      Leave
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <Button variant="ghost" onClick={() => (step === 0 ? requestClose() : setStep(step - 1))}>
                    {step === 0 ? (
                      'Cancel'
                    ) : (
                      <>
                        <ArrowLeft className="h-4 w-4" /> Back
                      </>
                    )}
                  </Button>
                  {step < STEPS.length - 1 ? (
                    <Button variant="pixelViolet" onClick={() => setStep(step + 1)}>
                      {step === 0 && !tailor ? 'Skip & continue' : step === 1 && !coverNote.trim() ? 'Skip cover note' : 'Continue'} <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <Button variant="pixel" onClick={submit} disabled={submitting}>
                        <ExternalLink className="h-4 w-4" /> {submitting ? 'Opening…' : `Apply on ${job.source}`}
                      </Button>
                      {submitError && (
                        <span role="alert" className="text-xs text-[var(--color-error)]">
                          {submitError}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </footer>
          </>
        )}
      </motion.div>
    </div>,
    document.body,
  )
}
