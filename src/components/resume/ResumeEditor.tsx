import { useState, type ReactNode } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { ResumeData, ResumeEntry } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import type { SpriteName } from '@/components/pixel/sprites'
import { AiButton } from './AiButton'
import { RESUME_AI_COST, suggestSkills } from '@/services/resumeAi'
import { api } from '@/services/api'
import { useWalletStore } from '@/stores/walletStore'
import { cn } from '@/utils/cn'

export type ResumeUpdate = (fn: (draft: ResumeData) => ResumeData) => void

const inputClass =
  'w-full border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]'

let idCounter = 0
const newId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block font-pixel text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  )
}

function SectionCard({ title, sprite, action, children }: { title: string; sprite: SpriteName; action?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <PixelSprite sprite={sprite} scale={2} /> {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface EntryListProps {
  entries: ResumeEntry[]
  onChange: (next: ResumeEntry[]) => void
  labels: { title: string; subtitle: string; addLabel: string; idPrefix: string }
  withBullets?: boolean
}

function EntryList({ entries, onChange, labels, withBullets = true }: EntryListProps) {
  const patch = (id: string, fn: (e: ResumeEntry) => ResumeEntry) => onChange(entries.map((e) => (e.id === id ? fn(e) : e)))

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className="border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)]/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={labels.title}>
              <input className={inputClass} value={entry.title} onChange={(e) => patch(entry.id, (x) => ({ ...x, title: e.target.value }))} />
            </Field>
            <Field label={labels.subtitle}>
              <input className={inputClass} value={entry.subtitle} onChange={(e) => patch(entry.id, (x) => ({ ...x, subtitle: e.target.value }))} />
            </Field>
            <Field label="Period">
              <input className={inputClass} value={entry.period} placeholder="2024 – Present" onChange={(e) => patch(entry.id, (x) => ({ ...x, period: e.target.value }))} />
            </Field>
            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={() => onChange(entries.filter((e) => e.id !== entry.id))}
                className="inline-flex items-center gap-1.5 px-2 py-2 font-pixel text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>

          {withBullets && (
            <div className="mt-4 space-y-2">
              <p className="font-pixel text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">Bullet points</p>
              {entry.bullets.map((bullet, i) => (
                <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <textarea
                    className={cn(inputClass, 'min-h-[44px] flex-1 resize-y')}
                    rows={2}
                    value={bullet}
                    aria-label={`Bullet ${i + 1}`}
                    placeholder="What did you do, and what changed because of it?"
                    onChange={(e) => patch(entry.id, (x) => ({ ...x, bullets: x.bullets.map((b, j) => (j === i ? e.target.value : b)) }))}
                  />
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <AiButton
                      label="Improve"
                      size="sm"
                      cost={RESUME_AI_COST.bullet}
                      disabled={!bullet.trim()}
                      onRun={async () => {
                        const { text, balance } = await api.improveBullet(bullet)
                        useWalletStore.getState().setBalance(balance)
                        patch(entry.id, (x) => ({ ...x, bullets: x.bullets.map((b, j) => (j === i ? text : b)) }))
                      }}
                    />
                    <button
                      type="button"
                      aria-label={`Remove bullet ${i + 1}`}
                      onClick={() => patch(entry.id, (x) => ({ ...x, bullets: x.bullets.filter((_, j) => j !== i) }))}
                      className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => patch(entry.id, (x) => ({ ...x, bullets: [...x.bullets, ''] }))}
                className="inline-flex items-center gap-1.5 font-pixel text-xs text-[var(--color-accent)] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add bullet
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...entries, { id: newId(labels.idPrefix), title: '', subtitle: '', period: '', bullets: withBullets ? [''] : [] }])}
        className="flex w-full items-center justify-center gap-2 border-2 border-dashed border-[var(--color-border-strong)] py-2.5 font-pixel text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        <Plus className="h-4 w-4" /> {labels.addLabel}
      </button>
    </div>
  )
}

export function ResumeEditor({ data, update }: { data: ResumeData; update: ResumeUpdate }) {
  const [skillDraft, setSkillDraft] = useState('')
  const suggestions = suggestSkills(data.skills)
  const set = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => update((d) => ({ ...d, [key]: value }))

  const addSkill = () => {
    const skill = skillDraft.trim()
    if (skill && !data.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) set('skills', [...data.skills, skill])
    setSkillDraft('')
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Basics" sprite="hero">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <input className={inputClass} value={data.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Headline">
            <input className={inputClass} value={data.headline} placeholder="Software Developer" onChange={(e) => set('headline', e.target.value)} />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" value={data.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={data.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Location">
            <input className={inputClass} value={data.location} onChange={(e) => set('location', e.target.value)} />
          </Field>
          <Field label="Links">
            <input className={inputClass} value={data.links} placeholder="github.com/you · linkedin.com/in/you" onChange={(e) => set('links', e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Summary"
        sprite="scroll"
        action={
          <AiButton
            label="Write summary"
            cost={RESUME_AI_COST.summary}
            onRun={async () => {
              const { text, balance } = await api.writeSummary(data)
              useWalletStore.getState().setBalance(balance)
              update((d) => ({ ...d, summary: text }))
            }}
          />
        }
      >
        <textarea
          className={cn(inputClass, 'resize-y')}
          rows={4}
          value={data.summary}
          aria-label="Professional summary"
          placeholder="2–3 sentences on who you are, what you're great at, and what you want next — or let Quest AI draft it."
          onChange={(e) => set('summary', e.target.value)}
        />
      </SectionCard>

      <SectionCard
        title="Skills"
        sprite="sword"
        action={
          suggestions.length ? (
            <AiButton
              label="Suggest skills"
              cost={RESUME_AI_COST.skills}
              onRun={async () => {
                const { skills, balance } = await api.suggestSkills(data.skills)
                useWalletStore.getState().setBalance(balance)
                update((d) => ({ ...d, skills: [...d.skills, ...skills.filter((s) => !d.skills.includes(s))] }))
              }}
            />
          ) : (
            <span className="font-pixel text-xs text-[var(--color-text-muted)]">All Logicraft skills added</span>
          )
        }
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {data.skills.map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1.5 border-2 border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)] py-0.5 pl-2 pr-1 font-pixel text-xs text-[var(--color-accent)]">
              {skill}
              <button type="button" aria-label={`Remove ${skill}`} onClick={() => set('skills', data.skills.filter((s) => s !== skill))} className="hover:text-[var(--color-error)]">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className={inputClass}
            value={skillDraft}
            placeholder="Add a skill and press Enter"
            aria-label="New skill"
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSkill()
              }
            }}
          />
          <button type="button" onClick={addSkill} className="shrink-0 border-2 border-[var(--color-border-strong)] px-3 font-pixel text-xs hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
            Add
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Experience" sprite="castle">
        <EntryList
          entries={data.experience}
          onChange={(next) => set('experience', next)}
          labels={{ title: 'Role', subtitle: 'Company', addLabel: 'Add experience', idPrefix: 'exp' }}
        />
      </SectionCard>

      <SectionCard title="Projects" sprite="terminal">
        <EntryList
          entries={data.projects}
          onChange={(next) => set('projects', next)}
          labels={{ title: 'Project name', subtitle: 'Tech stack', addLabel: 'Add project', idPrefix: 'proj' }}
        />
      </SectionCard>

      <SectionCard title="Education" sprite="book">
        <EntryList
          entries={data.education}
          onChange={(next) => set('education', next)}
          labels={{ title: 'Degree', subtitle: 'School', addLabel: 'Add education', idPrefix: 'edu' }}
          withBullets={false}
        />
      </SectionCard>

      <SectionCard title="Logicraft achievements" sprite="trophy">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={data.includeCodeQuestStats}
            onChange={(e) => set('includeCodeQuestStats', e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
          />
          <span className="text-sm text-[var(--color-text-secondary)]">
            Show your Logicraft rank, league, problems solved and practice streak as resume achievements.
          </span>
        </label>
      </SectionCard>
    </div>
  )
}
