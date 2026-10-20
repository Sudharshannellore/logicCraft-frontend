import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva('inline-flex items-center gap-1 whitespace-nowrap border-2 px-2 py-0.5 font-pixel text-xs', {
  variants: {
    variant: {
      neutral: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-strong)]',
      accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/35',
      violet: 'bg-[var(--color-violet-soft)] text-[var(--color-violet)] border-[var(--color-violet)]/35',
      info: 'bg-[var(--color-info)]/15 text-[var(--color-info)] border-[var(--color-info)]/35',
      warning: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-[var(--color-warning)]/35',
      error: 'bg-[var(--color-error)]/15 text-[var(--color-error)] border-[var(--color-error)]/35',
      success: 'bg-[var(--color-success)]/15 text-[var(--color-success)] border-[var(--color-success)]/35',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export function difficultyVariant(difficulty: 'easy' | 'medium' | 'hard') {
  return difficulty === 'easy' ? 'success' : difficulty === 'medium' ? 'warning' : 'error'
}
