import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { cn } from '@/utils/cn'

interface AIHintProps {
  title?: string
  hint: string
  defaultOpen?: boolean
  className?: string
}

export function AIHint({ title = 'Reveal hint', hint, defaultOpen = false, className }: AIHintProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn('overflow-hidden border-2 border-[var(--color-violet)]/40 bg-[var(--color-violet-soft)] shadow-[3px_3px_0_var(--pixel-ink)]', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-2 p-3 text-left font-pixel text-sm text-[var(--color-violet)] transition-colors hover:bg-[var(--color-violet)]/10"
      >
        <span className="flex items-center gap-2">
          <PixelSprite sprite={open ? 'scroll' : 'potion'} scale={1.5} className={cn(!open && 'group-hover:animate-pixel-bob')} />
          {title}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <p className="border-t-2 border-[var(--color-violet)]/25 p-3 text-sm leading-relaxed text-[var(--color-text-primary)]">{hint}</p>}
    </div>
  )
}
