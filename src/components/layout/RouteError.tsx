import { useEffect } from 'react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/Button'
import { PixelSprite } from '@/components/pixel/PixelSprite'

const RELOAD_KEY = 'codequest-chunk-reload'

/** A lazily loaded page whose file changed (new deploy, or a dev-server re-bundle) can no longer be fetched. */
function isStaleChunk(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Outdated Optimize Dep/i.test(message)
}

/** Route error screen: reloads automatically for stale page files, otherwise shows a friendly error instead of a crash. */
export function RouteError() {
  const error = useRouteError()
  const stale = isStaleChunk(error)

  useEffect(() => {
    if (!stale) return
    try {
      // Reload to pick up the fresh files — at most once every 10s, so a server that's truly down can't cause a loop.
      const last = Number(window.sessionStorage.getItem(RELOAD_KEY) ?? 0)
      if (Date.now() - last < 10_000) return
      window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
    } catch {
      return
    }
    window.location.reload()
  }, [stale])

  const detail = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : null

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--color-bg)] px-6 text-center text-[var(--color-text-primary)]">
      <PixelSprite sprite="bugSlime" scale={6} fps={3} className="animate-pixel-bob" />
      <h1 className="text-2xl sm:text-3xl">{stale ? 'This page got an update' : 'A bug slipped through'}</h1>
      <p className="max-w-md text-sm text-[var(--color-text-secondary)]">
        {stale
          ? "The page's files changed while you were playing. Reload to load the new version — your XP and progress are saved."
          : 'Something went wrong loading this page. Your XP and progress are saved — try reloading.'}
      </p>
      {detail && !stale && <p className="max-w-md break-words font-mono text-xs text-[var(--color-text-muted)]">{detail}</p>}
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="pixel" onClick={() => window.location.reload()}>
          Reload page
        </Button>
        <Link to="/dashboard" reloadDocument className={buttonVariants({ variant: 'outline' })}>
          Return to Base
        </Link>
      </div>
    </div>
  )
}
