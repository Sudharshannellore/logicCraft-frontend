import { useEffect, useState } from 'react'
import { Check, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { XpPurchaseButton } from '@/components/economy/XpPurchaseButton'
import { templateName, useResumeTemplates } from './templates'
import { MAX_RESUMES, RESUME_SLOT_COST, slotCount, useResumeStore } from '@/stores/resumeStore'
import { cn } from '@/utils/cn'

function NewResumeButton({ source, label, freeSlot, full }: { source: 'starter' | 'duplicate'; label: string; freeSlot: boolean; full: boolean }) {
  const create = useResumeStore((s) => s.create)
  const Icon = source === 'starter' ? Plus : Copy

  if (full) return null
  if (freeSlot) {
    return (
      <button
        type="button"
        onClick={() => create(source)}
        className="inline-flex items-center gap-1.5 whitespace-nowrap border-2 border-[var(--color-border-strong)] px-3 py-1.5 font-pixel text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        <Icon className="h-3.5 w-3.5" /> {label} · Free slot
      </button>
    )
  }
  return (
    <XpPurchaseButton cost={RESUME_SLOT_COST} onPurchase={() => create(source)}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </XpPurchaseButton>
  )
}

/** "My resumes" bar: switch, rename, duplicate and delete resumes; extra slots cost XP. */
export function ResumeLibrary() {
  const templates = useResumeTemplates()
  const resumes = useResumeStore((s) => s.resumes)
  const activeId = useResumeStore((s) => s.activeId)
  const slots = useResumeStore(slotCount)
  const select = useResumeStore((s) => s.select)
  const rename = useResumeStore((s) => s.rename)
  const remove = useResumeStore((s) => s.remove)
  const [editing, setEditing] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!confirmDelete) return
    const id = window.setTimeout(() => setConfirmDelete(null), 3000)
    return () => window.clearTimeout(id)
  }, [confirmDelete])

  const freeSlot = resumes.length < slots
  const full = resumes.length >= MAX_RESUMES

  const saveTitle = () => {
    if (editing && draftTitle.trim()) rename(editing, draftTitle.trim())
    setEditing(null)
  }

  return (
    <section aria-label="My resumes" className="mb-6 border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4 shadow-[4px_4px_0_var(--pixel-ink)]">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="flex items-center gap-2 text-base">
          <PixelSprite sprite="chest" scale={2} /> My resumes
        </h2>
        <span className="font-pixel text-xs text-[var(--color-text-muted)]" title={`1 slot is free; extra slots cost ${RESUME_SLOT_COST} XP each. Deleting a resume frees its slot.`}>
          Slots {resumes.length}/{slots}
          {freeSlot && <span className="text-[var(--color-accent)]"> · {slots - resumes.length} free</span>}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <NewResumeButton source="starter" label="New resume" freeSlot={freeSlot} full={full} />
          <NewResumeButton source="duplicate" label="Duplicate" freeSlot={freeSlot} full={full} />
          {full && <span className="font-pixel text-xs text-[var(--color-text-muted)]">Maximum of {MAX_RESUMES} resumes</span>}
        </div>
      </div>

      <div className="pixel-scroll flex gap-2.5 overflow-x-auto pb-1">
        {resumes.map((r) => {
          const active = r.id === activeId
          return (
            <div
              key={r.id}
              className={cn(
                'group flex min-w-[210px] max-w-[260px] shrink-0 items-center gap-2.5 border-2 px-3 py-2 transition-colors',
                active ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-elevated)]',
              )}
            >
              {editing === r.id ? (
                <form
                  className="flex min-w-0 flex-1 items-center gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault()
                    saveTitle()
                  }}
                >
                  <input
                    autoFocus
                    value={draftTitle}
                    maxLength={40}
                    aria-label="Resume name"
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => e.key === 'Escape' && setEditing(null)}
                    className="min-w-0 flex-1 border-2 border-[var(--color-accent)] bg-[var(--color-bg)] px-1.5 py-0.5 font-pixel text-sm outline-none"
                  />
                  <button type="submit" aria-label="Save name" className="text-[var(--color-accent)]">
                    <Check className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <>
                  <button type="button" onClick={() => select(r.id)} aria-pressed={active} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                    <PixelSprite sprite="resume" scale={1.5} className={cn(active && 'animate-pixel-bob')} />
                    <span className="min-w-0">
                      <span className={cn('block truncate font-pixel text-sm', active && 'text-[var(--color-accent)]')}>{r.title}</span>
                      <span className="block truncate text-[11px] text-[var(--color-text-muted)]">{templateName(templates, r.templateId)} template</span>
                    </span>
                  </button>
                  {active && (
                    <span className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Rename ${r.title}`}
                        title="Rename"
                        onClick={() => {
                          setDraftTitle(r.title)
                          setEditing(r.id)
                        }}
                        className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {resumes.length > 1 && (
                        <button
                          type="button"
                          aria-label={confirmDelete === r.id ? `Confirm delete ${r.title}` : `Delete ${r.title}`}
                          title={confirmDelete === r.id ? 'Click again to delete' : 'Delete (frees the slot)'}
                          onClick={() => {
                            if (confirmDelete !== r.id) return setConfirmDelete(r.id)
                            remove(r.id)
                            setConfirmDelete(null)
                          }}
                          className={cn(
                            'flex items-center gap-1 p-1 font-pixel text-[11px]',
                            confirmDelete === r.id ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-error)]',
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {confirmDelete === r.id && 'Sure?'}
                        </button>
                      )}
                    </span>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
