import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { FrameworkSummary } from '@/types'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { languageMeta } from '@/components/learning/languages'
import { cn } from '@/utils/cn'

/** The framework courses as pixel tabs. Loads the list itself and tells the parent which one is selected. */
export function FrameworkPicker({
  value,
  onChange,
  children,
}: {
  value: string | null
  onChange: (courseId: string) => void
  children: (selected: FrameworkSummary) => React.ReactNode
}) {
  const { data: frameworks, isError } = useQuery({ queryKey: ['frameworks'], queryFn: api.getFrameworks, staleTime: 60_000 })

  if (isError) return <p className="py-10 text-center text-sm text-[var(--color-text-secondary)]">Frameworks couldn't be loaded right now. Try again in a minute.</p>
  if (!frameworks) return <p className="py-10 text-center font-pixel text-sm text-[var(--color-text-muted)]">Loading frameworks…</p>
  if (frameworks.length === 0) return <p className="py-10 text-center text-sm text-[var(--color-text-secondary)]">No framework courses are available right now.</p>

  const selected = frameworks.find((f) => f.courseId === value) ?? frameworks[0]
  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Framework">
        {frameworks.map((f) => (
          <button
            key={f.courseId}
            type="button"
            role="tab"
            aria-selected={f.courseId === selected.courseId}
            onClick={() => onChange(f.courseId)}
            className={cn(
              'flex items-center gap-2 border-2 px-3 py-1.5 font-pixel text-sm transition-transform duration-75',
              f.courseId === selected.courseId
                ? '-translate-y-0.5 border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] shadow-[3px_3px_0_var(--pixel-ink)]'
                : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:-translate-y-0.5 hover:text-[var(--color-text-primary)]',
            )}
          >
            <PixelSprite sprite={languageMeta(f.language).sprite} scale={1.25} />
            {f.title}
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {f.solved}/{f.topics}
            </span>
          </button>
        ))}
      </div>
      {children(selected)}
    </>
  )
}
