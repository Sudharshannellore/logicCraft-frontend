import { useRef, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { cn } from '@/utils/cn'

interface ResizeHandleProps {
  /** Element whose size the percentage is measured against. */
  containerRef: RefObject<HTMLElement | null>
  orientation: 'vertical' | 'horizontal'
  value: number
  min: number
  max: number
  onChange: (percent: number) => void
  label: string
  className?: string
}

/**
 * Draggable divider between two panes. `vertical` separates left/right panes (drag on x);
 * `horizontal` separates top/bottom panes (drag on y). Arrow keys nudge it by 2%.
 */
export function ResizeHandle({ containerRef, orientation, value, min, max, onChange, label, className }: ResizeHandleProps) {
  const dragging = useRef(false)
  const clamp = (v: number) => Math.min(max, Math.max(min, v))

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!dragging.current || !rect) return
    const percent = orientation === 'vertical' ? ((e.clientX - rect.left) / rect.width) * 100 : ((e.clientY - rect.top) / rect.height) * 100
    onChange(clamp(percent))
  }

  const endDrag = () => {
    dragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const back = orientation === 'vertical' ? 'ArrowLeft' : 'ArrowUp'
    const forward = orientation === 'vertical' ? 'ArrowRight' : 'ArrowDown'
    if (e.key === back) onChange(clamp(value - 2))
    else if (e.key === forward) onChange(clamp(value + 2))
    else if (e.key === 'Home') onChange(min)
    else if (e.key === 'End') onChange(max)
    else return
    e.preventDefault()
  }

  const vertical = orientation === 'vertical'

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      className={cn(
        'group relative z-10 hidden shrink-0 items-center justify-center bg-[var(--pixel-ink)] outline-none transition-colors hover:bg-[var(--color-accent)]/40 focus-visible:bg-[var(--color-accent)]/60 lg:flex',
        vertical ? 'w-2 cursor-col-resize' : 'h-2 cursor-row-resize',
        className,
      )}
    >
      <span className={cn('flex gap-[3px]', vertical ? 'flex-col' : 'flex-row')} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-[3px] w-[3px] bg-[var(--color-text-muted)] group-hover:bg-[var(--color-accent)]" />
        ))}
      </span>
    </div>
  )
}
