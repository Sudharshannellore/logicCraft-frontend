import { PixelSprite } from '@/components/pixel/PixelSprite'
import { cn } from '@/utils/cn'

export type Mode = 'languages' | 'frameworks'

const tab = (active: boolean) =>
  cn(
    'flex items-center gap-2 border-2 px-4 py-2 font-pixel text-sm uppercase tracking-wider transition-transform duration-75',
    active
      ? '-translate-y-0.5 border-[var(--color-accent)] bg-[var(--color-accent)] text-[#06120a] shadow-[3px_3px_0_var(--pixel-ink)]'
      : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:-translate-y-0.5 hover:text-[var(--color-text-primary)]',
  )

/** Languages (Exercism exercises) or frameworks (quizzes from the framework's docs). */
export function ModeTabs({ value, onChange }: { value: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="What to practise">
      <button type="button" role="tab" aria-selected={value === 'languages'} onClick={() => onChange('languages')} className={tab(value === 'languages')}>
        <PixelSprite sprite="terminal" scale={1.25} /> Languages
      </button>
      <button type="button" role="tab" aria-selected={value === 'frameworks'} onClick={() => onChange('frameworks')} className={tab(value === 'frameworks')}>
        <PixelSprite sprite="gear" scale={1.25} /> Frameworks
      </button>
    </div>
  )
}
