import type { CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PixelTransition } from '@/components/pixel/PixelTransition'

// No sidebar or top bar: fixed layers (backdrops, transition) span the full viewport.
const focusVars = { '--sidebar-w': '0px', '--topbar-h': '0px' } as CSSProperties

/** Distraction-free layout for play boards: the board owns the whole screen. */
export function FocusShell() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-text-primary)]" style={focusVars}>
      <main>
        <Outlet />
      </main>
      <PixelTransition key={pathname} className="inset-0" />
    </div>
  )
}
