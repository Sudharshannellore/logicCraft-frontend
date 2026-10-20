import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/utils/cn'

const inputClass =
  'w-full border-2 bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] disabled:opacity-60'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | null
  hint?: ReactNode
}

export function TextField({ label, error, hint, className, ...props }: TextFieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-pixel text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={cn(inputClass, error ? 'border-[var(--color-error)]' : 'border-[var(--color-border-strong)]')}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-[var(--color-error)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function PasswordField(props: Omit<TextFieldProps, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <TextField {...props} type={visible ? 'text' : 'password'} className={cn('[&_input]:pr-11', props.className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-2 top-[30px] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

/** A form-level error (wrong password, network down, …). */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 border-2 border-[var(--color-error)]/50 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-text-primary)]">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-error)]" />
      <span>{children}</span>
    </div>
  )
}
