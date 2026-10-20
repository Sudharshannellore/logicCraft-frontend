import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, UserPlus } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FormAlert, PasswordField, TextField } from '@/components/auth/AuthFields'
import { EMAIL_PATTERN, passwordProblem, safeNext } from '@/utils/auth'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { Button } from '@/components/ui/Button'
import { errorMessage, isApiError } from '@/services/api/client'
import { signUp } from '@/services/auth'
import { cn } from '@/utils/cn'

type Field = 'username' | 'email' | 'password' | 'confirm'

function validate(values: Record<Field, string>): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {}
  const name = values.username.trim()
  if (name.length < 2) errors.username = 'Pick a name with at least 2 characters.'
  else if (name.length > 32) errors.username = 'Keep it to 32 characters or fewer.'
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address.'
  const problem = passwordProblem(values.password)
  if (problem) errors.password = problem
  if (!errors.password && values.confirm !== values.password) errors.confirm = "The passwords don't match."
  return errors
}

function Rule({ ok, children }: { ok: boolean; children: string }) {
  return (
    <li className={cn('flex items-center gap-1.5', ok ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]')}>
      {ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="inline-block h-1.5 w-1.5 bg-current" />}
      {children}
    </li>
  )
}

export default function SignUp() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [values, setValues] = useState<Record<Field, string>>({ username: '', email: '', password: '', confirm: '' })
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [serverErrors, setServerErrors] = useState<Partial<Record<Field, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const errors = validate(values)
  const shown = (field: Field) => serverErrors[field] ?? (touched[field] ? errors[field] : undefined)
  const change = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    setServerErrors((s) => ({ ...s, [field]: undefined }))
  }
  const blur = (field: Field) => () => setTouched((t) => ({ ...t, [field]: true }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched({ username: true, email: true, password: true, confirm: true })
    if (Object.keys(errors).length) return
    setSubmitting(true)
    setFormError(null)
    try {
      await signUp(values.username, values.email, values.password)
      navigate(safeNext(params.get('next')), { replace: true })
    } catch (err) {
      if (isApiError(err) && err.code === 'email_taken') setServerErrors({ email: 'An account with this email already exists. Sign in instead?' })
      else if (isApiError(err, 422) && typeof err.details.field === 'string' && err.details.field in values)
        setServerErrors({ [err.details.field as Field]: err.message.replace(/^\w+: /, '') })
      else setFormError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Start your quest"
      subtitle="Create a free account — you start with 200 XP."
      footer={
        <>
          Already have an account?{' '}
          <Link to={`/signin${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`} className="font-pixel text-[var(--color-accent)] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <FormAlert>{formError}</FormAlert>}
        <TextField
          label="Display name"
          autoComplete="nickname"
          autoFocus
          maxLength={32}
          value={values.username}
          onChange={change('username')}
          onBlur={blur('username')}
          error={shown('username')}
          hint="Shown on leaderboards and to friends."
          disabled={submitting}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={change('email')}
          onBlur={blur('email')}
          error={shown('email')}
          disabled={submitting}
        />
        <div>
          <PasswordField
            label="Password"
            autoComplete="new-password"
            maxLength={128}
            value={values.password}
            onChange={change('password')}
            onBlur={blur('password')}
            error={shown('password')}
            disabled={submitting}
          />
          <ul className="mt-2 grid grid-cols-2 gap-1 font-pixel text-[11px]" aria-label="Password rules">
            <Rule ok={values.password.length >= 8}>8+ characters</Rule>
            <Rule ok={/[A-Za-z]/.test(values.password) && /\d/.test(values.password)}>A letter and a number</Rule>
          </ul>
        </div>
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          value={values.confirm}
          onChange={change('confirm')}
          onBlur={blur('confirm')}
          error={shown('confirm')}
          disabled={submitting}
        />
        <Button type="submit" variant="pixel" size="lg" className="w-full" disabled={submitting}>
          <UserPlus className="h-4 w-4" /> {submitting ? 'Creating account…' : 'Create account'}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <PixelSprite sprite="star" scale={1} /> 200 starter XP for Quest AI and your first template
        </p>
      </form>
    </AuthLayout>
  )
}
