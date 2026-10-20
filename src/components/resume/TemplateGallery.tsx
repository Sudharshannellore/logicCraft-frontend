import { Check, Eye, Lock } from 'lucide-react'
import type { ResumeData, ResumeTemplateId } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { XpPurchaseButton } from '@/components/economy/XpPurchaseButton'
import { ScaledResume } from './ScaledResume'
import { useResumeTemplates } from './templates'
import { useResumeStore } from '@/stores/resumeStore'
import { cn } from '@/utils/cn'

interface TemplateGalleryProps {
  data: ResumeData
  activeTemplate: ResumeTemplateId
  previewTemplate: ResumeTemplateId | null
  onPreview: (id: ResumeTemplateId | null) => void
}

/** Template picker: free templates apply instantly; premium ones can be previewed, then unlocked once with XP. */
export function TemplateGallery({ data, activeTemplate, previewTemplate, onPreview }: TemplateGalleryProps) {
  const resumeTemplates = useResumeTemplates()
  const unlocked = useResumeStore((s) => s.unlockedTemplates)
  const setTemplate = useResumeStore((s) => s.setTemplate)
  const unlockTemplate = useResumeStore((s) => s.unlockTemplate)

  const use = (id: ResumeTemplateId) => {
    setTemplate(id)
    onPreview(null)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-secondary)]">
        All {resumeTemplates.length} templates are text-only and ATS-friendly — no graphics or colour blocks to confuse resume scanners. Some are free; unlock any other once with XP and use it on all of your resumes.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {resumeTemplates.map((t) => {
          const isUnlocked = unlocked.includes(t.id)
          const inUse = t.id === activeTemplate
          const previewing = t.id === previewTemplate
          return (
            <div
              key={t.id}
              className={cn(
                'flex flex-col border-2 bg-[var(--color-surface)] transition-colors',
                inUse ? 'border-[var(--color-accent)]' : previewing ? 'border-[var(--color-violet)]' : 'border-[var(--color-border-strong)]',
              )}
            >
              <button
                type="button"
                onClick={() => (isUnlocked ? use(t.id) : onPreview(previewing ? null : t.id))}
                aria-label={isUnlocked ? `Use ${t.name} template` : `Preview ${t.name} template`}
                className="group relative block overflow-hidden bg-[var(--color-bg)] p-3 text-left"
              >
                <div className="relative mx-auto max-w-[220px] shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-transform duration-150 group-hover:-translate-y-1">
                  <ScaledResume data={data} template={t.id} className="pointer-events-none" />
                  {!isUnlocked && (
                    <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center bg-[#0b0d12]/80 text-[var(--color-warning)]">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </button>
              <div className="flex flex-1 flex-col gap-2 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-pixel text-sm">{t.name}</p>
                  {inUse ? (
                    <Badge variant="accent">
                      <Check className="h-3 w-3" /> In use
                    </Badge>
                  ) : t.cost === 0 ? (
                    <Badge variant="success">Free</Badge>
                  ) : isUnlocked ? (
                    <Badge variant="violet">Unlocked</Badge>
                  ) : (
                    <Badge variant="warning">{t.cost} XP</Badge>
                  )}
                </div>
                <p className="flex-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{t.description}</p>
                {inUse ? null : isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => use(t.id)}
                    className="border-2 border-[var(--color-border-strong)] py-1.5 font-pixel text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    Use template
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <XpPurchaseButton
                      size="sm"
                      cost={t.cost}
                      onPurchase={async () => {
                        const ok = await unlockTemplate(t.id)
                        if (ok) use(t.id)
                        return ok
                      }}
                    >
                      Unlock
                    </XpPurchaseButton>
                    <button
                      type="button"
                      onClick={() => onPreview(previewing ? null : t.id)}
                      aria-pressed={previewing}
                      className={cn(
                        'inline-flex items-center justify-center gap-1 border-2 px-2 py-1 font-pixel text-[11px] transition-colors',
                        previewing
                          ? 'border-[var(--color-violet)] bg-[var(--color-violet-soft)] text-[var(--color-violet)]'
                          : 'border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:border-[var(--color-violet)] hover:text-[var(--color-violet)]',
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" /> {previewing ? 'Previewing' : 'Preview'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
