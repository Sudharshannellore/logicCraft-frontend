import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const baseButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none font-pixel font-medium tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'pixel-btn bg-[var(--color-accent)] text-[#06120a] active:scale-100',
        secondary: 'pixel-btn bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] active:scale-100',
        violet: 'pixel-btn bg-[var(--color-violet)] text-[#140b2e] active:scale-100',
        ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]',
        outline:
          'border-2 border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
        danger: 'border-2 border-[var(--color-error)]/40 bg-[var(--color-error)]/15 text-[var(--color-error)] hover:bg-[var(--color-error)]/25',
        pixel: 'pixel-btn rounded-none font-pixel tracking-wide bg-[var(--color-accent)] text-[#06120a] active:scale-100',
        pixelViolet: 'pixel-btn rounded-none font-pixel tracking-wide bg-[var(--color-violet)] text-[#140b2e] active:scale-100',
        pixelDark:
          'pixel-btn rounded-none font-pixel tracking-wide bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] active:scale-100',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type ButtonVariantProps = VariantProps<typeof baseButtonVariants>

// Merged so variant classes (e.g. pixel's rounded-none) beat base classes even when used without cn().
export const buttonVariants = (props?: ButtonVariantProps) => cn(baseButtonVariants(props))

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
)
Button.displayName = 'Button'
