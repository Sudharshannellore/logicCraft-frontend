import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/layout/PageLoader'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { Button } from '@/components/ui/Button'
import { bootstrapSession } from '@/services/auth'
import { errorMessage } from '@/services/api/client'
import { useAuthStore } from '@/stores/authStore'
import { useWalletStore } from '@/stores/walletStore'
import { safeNext } from '@/utils/auth'

/** Signed-in screens: sends visitors to sign in (and back here afterwards), and loads the session first. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  const ready = useWalletStore((s) => s.loaded)
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!token || ready) return
    let cancelled = false
    // A 401 here signs the stale session out (see the API client), which redirects below.
    bootstrapSession().catch((e) => !cancelled && setError(errorMessage(e)))
    return () => {
      cancelled = true
    }
  }, [token, ready, attempt])

  if (!token) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/signin?next=${encodeURIComponent(next)}`} replace />
  }
  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <PixelSprite sprite="bugSlime" scale={5} fps={3} className="animate-pixel-bob" />
        <h1 className="text-xl">Can't load your quest</h1>
        <p className="max-w-md text-sm text-[var(--color-text-secondary)]">{error}</p>
        <Button
          variant="pixel"
          onClick={() => {
            setError(null)
            setAttempt((a) => a + 1)
          }}
        >
          Try again
        </Button>
      </div>
    )
  }
  if (!ready) return <PageLoader />
  return <>{children}</>
}

/** Sign-in and sign-up: already signed-in players go straight to where they were heading. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  const location = useLocation()
  if (token) return <Navigate to={safeNext(new URLSearchParams(location.search).get('next'))} replace />
  return <>{children}</>
}
