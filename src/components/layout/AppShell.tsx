import type { CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { PixelTransition } from '@/components/pixel/PixelTransition'
import { SIDEBAR_WIDTH, useSidebarStore } from '@/stores/sidebarStore'

export function AppShell() {
  const { pathname } = useLocation()
  const collapsed = useSidebarStore((s) => s.collapsed)
  // Fixed-position layers (page transition, page backdrops) offset themselves by this width.
  const shellStyle = {
    '--sidebar-w': `${collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded}px`,
    '--topbar-h': '4rem',
  } as CSSProperties

  return (
    <div className="flex min-h-dvh bg-[var(--color-bg)] text-[var(--color-text-primary)]" style={shellStyle}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <PixelTransition key={pathname} className="inset-x-0 bottom-0 top-16 lg:left-[var(--sidebar-w)]" />
    </div>
  )
}
