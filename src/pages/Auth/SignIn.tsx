import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FormAlert, PasswordField, TextField } from '@/components/auth/AuthFields'
import { EMAIL_PATTERN, safeNext } from '@/utils/auth'
import { Button } from '@/components/ui/Button'
import { errorMessage, isApiError } from '@/services/api/client'
import { signIn } from '@/services/auth'
import { playSound } from '@/services/sound'

export default function SignIn() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  const emailError = touched && !EMAIL_PATTERN.test(email.trim()) ? 'Enter the email you signed up with.' : null
  const passwordError = touched && !password ? 'Enter your password.' : null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!EMAIL_PATTERN.test(email.trim()) || !password) return playSound('error')
    setSubmitting(true)
    setError(null)
    try {
      await signIn(email, password)
      navigate(safeNext(params.get('next')), { replace: true })
    } catch (err) {
      setError(isApiError(err, 401) ? 'That email and password don’t match. Check them and try again.' : errorMessage(err))
      setSubmitting(false)
      playSound('error')
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your quest."
      footer={
        <>
          New to Logicraft?{' '}
          <Link to={`/signup${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`} className="font-pixel text-[var(--color-accent)] hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <FormAlert>{error}</FormAlert>}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          disabled={submitting}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
          disabled={submitting}
        />
        <Button type="submit" variant="pixel" size="lg" className="w-full" disabled={submitting}>
          <LogIn className="h-4 w-4" /> {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
