import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Briefcase, Download, RotateCcw } from 'lucide-react'
import type { ResumeData, ResumeTemplateId, SavedResume, TailorResult } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button, buttonVariants } from '@/components/ui/Button'
import { PixelBar } from '@/components/pixel/PixelBar'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { XpBalance } from '@/components/economy/EconomyBits'
import { AiButton } from '@/components/resume/AiButton'
import { ResumeEditor, type ResumeUpdate } from '@/components/resume/ResumeEditor'
import { ResumePreview } from '@/components/resume/ResumePreview'
import { ScaledResume } from '@/components/resume/ScaledResume'
import { ResumeLibrary } from '@/components/resume/ResumeLibrary'
import { TemplateGallery } from '@/components/resume/TemplateGallery'
import { XpPurchaseButton } from '@/components/economy/XpPurchaseButton'
import { templateName, useResumeTemplates } from '@/components/resume/templates'
import { cn } from '@/utils/cn'
import { RESUME_AI_COST } from '@/services/resumeAi'
import { api } from '@/services/api'
import { PageLoader } from '@/components/layout/PageLoader'
import { RESUME_SLOT_COST, selectActive, useResumeLibrary, useResumeStore } from '@/stores/resumeStore'
import { useWalletStore } from '@/stores/walletStore'

const priceList = [
  { label: 'Summary', cost: RESUME_AI_COST.summary },
  { label: 'Improve bullet', cost: RESUME_AI_COST.bullet },
  { label: 'Suggest skills', cost: RESUME_AI_COST.skills },
  { label: 'Tailor to job', cost: RESUME_AI_COST.tailor },
]


const TABS = [
  { id: 'content', label: 'Content', sprite: 'scroll' },
  { id: 'templates', label: 'Templates', sprite: 'gem' },
  { id: 'tailor', label: 'Tailor to job', sprite: 'compass' },
] as const
type Tab = (typeof TABS)[number]['id']

function TailorPanel({ data, update }: { data: ResumeData; update: ResumeUpdate }) {
  const [job, setJob] = useState('')
  const [result, setResult] = useState<TailorResult | null>(null)
  const [applied, setApplied] = useState(false)

  return (
    <Card className="border-[var(--color-violet)]/50">
      <CardHeader className="flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <PixelSprite sprite="compass" scale={2} /> Tailor to a job
        </CardTitle>
        <AiButton
          label="Tailor resume"
          cost={RESUME_AI_COST.tailor}
          disabled={job.trim().length < 30}
          onRun={async () => {
            const { result: tailored, balance } = await api.tailorResume(data, { jobDescription: job })
            useWalletStore.getState().setBalance(balance)
            setResult(tailored)
            setApplied(false)
          }}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          value={job}
          onChange={(e) => setJob(e.target.value)}
          rows={4}
          aria-label="Job description"
          placeholder="Paste the job description here — Quest AI checks which of its skills your resume shows and rewrites your summary to match."
          className="w-full resize-y border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-violet)]"
        />

        {result && (
          <div className="space-y-4 border-2 border-[var(--color-violet)]/40 bg-[var(--color-violet-soft)] p-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between font-pixel text-sm">
                <span>Keyword match</span>
                <span className={result.score >= 70 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}>{result.score}%</span>
              </div>
              <PixelBar percent={result.score} segments={20} color={result.score >= 70 ? 'accent' : 'warning'} label="Job keyword match" />
            </div>
            {result.matched.length + result.missing.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">No familiar tech keywords found in that posting — try pasting the full requirements section.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 font-pixel text-xs uppercase tracking-wider text-[var(--color-success)]">On your resume</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched.length ? (
                      result.matched.map((k) => (
                        <span key={k} className="border-2 border-[var(--color-success)]/40 px-1.5 font-pixel text-[11px] text-[var(--color-success)]">
                          {k}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">None yet</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 font-pixel text-xs uppercase tracking-wider text-[var(--color-warning)]">Missing</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing.length ? (
                      result.missing.map((k) => (
                        <span key={k} className="border-2 border-[var(--color-warning)]/40 px-1.5 font-pixel text-[11px] text-[var(--color-warning)]">
                          {k}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">Nothing — great fit!</span>
                    )}
                  </div>
                  {result.missing.length > 0 && (
                    <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">Add these only where you genuinely have the experience.</p>
                  )}
                </div>
              </div>
            )}
            <div>
              <p className="mb-1.5 font-pixel text-xs uppercase tracking-wider text-[var(--color-violet)]">Tailored summary</p>
              <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">{result.summary}</p>
              <Button
                size="sm"
                variant={applied ? 'outline' : 'violet'}
                className="mt-3"
                disabled={applied}
                onClick={() => {
                  update((d) => ({ ...d, summary: result.summary }))
                  setApplied(true)
                }}
              >
                {applied ? 'Summary applied' : 'Use this summary'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ResumeBuilder() {
  const loaded = useResumeLibrary()
  const templates = useResumeTemplates()
  const premiumCosts = templates.filter((t) => t.cost > 0).map((t) => t.cost)
  const active = useResumeStore(selectActive) as SavedResume | undefined
  const update = useResumeStore((s) => s.update)
  const reset = useResumeStore((s) => s.reset)
  const unlockTemplate = useResumeStore((s) => s.unlockTemplate)
  const setTemplate = useResumeStore((s) => s.setTemplate)
  const saving = useResumeStore((s) => s.saving)
  const saveError = useResumeStore((s) => s.saveError)
  const [confirmReset, setConfirmReset] = useState(false)
  const [tab, setTab] = useState<Tab>('content')
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplateId | null>(null)

  useEffect(() => {
    if (!confirmReset) return
    const id = window.setTimeout(() => setConfirmReset(false), 3000)
    return () => window.clearTimeout(id)
  }, [confirmReset])

  if (!loaded || !active) return <PageLoader />

  const data = active.data
  const shownTemplate = previewTemplate ?? active.templateId
  const previewing = previewTemplate && previewTemplate !== active.templateId ? templates.find((t) => t.id === previewTemplate) : null

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <div className="pixel-corners flex h-16 w-16 shrink-0 items-center justify-center bg-[var(--color-accent-soft)]">
          <PixelSprite sprite="resume" scale={4} className="animate-pixel-hover" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl">Resume Builder</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Write it yourself for free — let Quest AI polish it for XP.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span role="status" className={cn('font-pixel text-xs', saveError ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]')} title={saveError ?? undefined}>
            {saveError ? 'Not saved' : saving ? 'Saving…' : 'All changes saved'}
          </span>
          <XpBalance className="px-2 py-1.5 text-sm" />
          <Button
            variant={confirmReset ? 'danger' : 'ghost'}
            size="sm"
            onClick={() => {
              if (!confirmReset) return setConfirmReset(true)
              void reset()
              setConfirmReset(false)
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> {confirmReset ? 'Click again to reset' : 'Reset this resume'}
          </Button>
          <Link to="/jobs" className={buttonVariants({ variant: 'pixelViolet', size: 'md' })}>
            <Briefcase className="h-4 w-4" /> Apply to jobs
          </Link>
          <Button variant="pixel" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
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
        <span className="border-2 border-[var(--color-border-strong)] px-2 py-0.5 font-pixel text-xs text-[var(--color-text-secondary)]">
          Extra resume slot <span className="text-[var(--color-accent)]">{RESUME_SLOT_COST} XP</span>
        </span>
        {premiumCosts.length > 0 && (
          <span className="border-2 border-[var(--color-border-strong)] px-2 py-0.5 font-pixel text-xs text-[var(--color-text-secondary)]">
            Premium template{' '}
            <span className="text-[var(--color-accent)]">
              {Math.min(...premiumCosts)}–{Math.max(...premiumCosts)} XP
            </span>
          </span>
        )}
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">Editing, the free templates and PDF download cost nothing.</span>
      </div>

      <ResumeLibrary />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div role="tablist" aria-label="Resume builder" className="mb-5 flex gap-1 overflow-x-auto border-b-2 border-[var(--color-border)]">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => {
                  setTab(t.id)
                  setPreviewTemplate(null)
                }}
                className={cn(
                  '-mb-0.5 flex shrink-0 items-center gap-2 border-b-2 px-4 py-2 font-pixel text-sm transition-colors',
                  tab === t.id ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                )}
              >
                <PixelSprite sprite={t.sprite} scale={1.5} /> {t.label}
              </button>
            ))}
          </div>

          {/* Panels stay mounted so a paid tailoring result survives switching tabs. */}
          <div role="tabpanel" hidden={tab !== 'content'}>
            <ResumeEditor data={data} update={update} />
          </div>
          <div role="tabpanel" hidden={tab !== 'templates'}>
            <TemplateGallery data={data} activeTemplate={active.templateId} previewTemplate={previewTemplate} onPreview={setPreviewTemplate} />
          </div>
          <div role="tabpanel" hidden={tab !== 'tailor'}>
            <TailorPanel data={data} update={update} />
          </div>
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          {previewing && (
            <div className="mb-3 flex flex-wrap items-center gap-3 border-2 border-[var(--color-violet)] bg-[var(--color-violet-soft)] px-3 py-2">
              <p className="min-w-0 flex-1 font-pixel text-xs text-[var(--color-violet)]">Previewing {previewing.name} — unlock it to use and download.</p>
              <XpPurchaseButton
                size="sm"
                cost={previewing.cost}
                onPurchase={async () => {
                  const ok = await unlockTemplate(previewing.id)
                  if (ok) {
                    setTemplate(previewing.id)
                    setPreviewTemplate(null)
                  }
                  return ok
                }}
              >
                Unlock {previewing.name}
              </XpPurchaseButton>
              <button type="button" onClick={() => setPreviewTemplate(null)} className="font-pixel text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                Stop preview
              </button>
            </div>
          )}
          <p className="mb-2 flex flex-wrap items-center justify-between gap-2 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            <span>
              {active.title} · {templateName(templates, shownTemplate)}
            </span>
            <span className="normal-case tracking-normal">
              <mark className="bg-[#fff3c4] px-1 text-[#7a5200]">[highlighted]</mark> = fill in before sending
            </span>
          </p>
          <ScaledResume data={data} template={shownTemplate} paperClassName="shadow-[0_10px_40px_rgba(0,0,0,0.5)]" />
        </div>
      </div>

      {/* Print copy lives directly under <body>; print CSS hides the app and shows only this. */}
      {createPortal(
        <div className="resume-print-portal" aria-hidden="true">
          <ResumePreview data={data} template={active.templateId} />
        </div>,
        document.body,
      )}
    </div>
  )
}
