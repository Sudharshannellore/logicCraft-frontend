import { PixelSprite } from '@/components/pixel/PixelSprite'
import { languageMeta } from '@/components/learning/languages'
import type { LibraryLanguage } from '@/types'
import { cn } from '@/utils/cn'

const tabClass = (active: boolean) =>
  cn(
    'flex items-center gap-2 border-2 px-3 py-1.5 font-pixel text-sm transition-transform duration-75',
    active
      ? '-translate-y-0.5 border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] shadow-[3px_3px_0_var(--pixel-ink)]'
      : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:-translate-y-0.5 hover:text-[var(--color-text-primary)]',
  )

interface LanguagePickerProps {
  languages: LibraryLanguage[]
  value: string
  onChange: (id: string) => void
  /** Exercise counts and the "graded here" dot (Practice and Challenges). */
  showExercises?: boolean
  /** Adds an "All languages" tab with this value. */
  allValue?: string
}

/** The 13 languages as pixel tabs. With exercises shown, a green dot means this server runs the tests (and pays XP). */
export function LanguagePicker({ languages, value, onChange, showExercises = true, allValue }: LanguagePickerProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Language">
      {allValue !== undefined && (
        <button type="button" role="tab" aria-selected={value === allValue} onClick={() => onChange(allValue)} className={tabClass(value === allValue)}>
          <PixelSprite sprite="compass" scale={1.25} />
          All languages
        </button>
      )}
      {languages.map((lang) => (
        <button
          key={lang.id}
          type="button"
          role="tab"
          aria-selected={lang.id === value}
          onClick={() => onChange(lang.id)}
          title={showExercises ? (lang.gradable ? 'Tests run here — earn XP' : 'Tests run on Exercism') : undefined}
          className={tabClass(lang.id === value)}
        >
          <PixelSprite sprite={languageMeta(lang.id).sprite} scale={1.25} />
          {lang.name}
          {showExercises && (
            <>
              {lang.exerciseCount != null && <span className="text-[11px] text-[var(--color-text-muted)]">{lang.exerciseCount}</span>}
              <span aria-hidden className={cn('h-2 w-2', lang.gradable ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-muted)]')} />
            </>
          )}
        </button>
      ))}
    </div>
  )
}
