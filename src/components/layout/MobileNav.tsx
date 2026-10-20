import { NavLink } from 'react-router-dom'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import type { SpriteName } from '@/components/pixel/sprites'
import { cn } from '@/utils/cn'

const items: { to: string; label: string; sprite: SpriteName }[] = [
  { to: '/dashboard', label: 'Home', sprite: 'castle' },
  { to: '/learn', label: 'Learn', sprite: 'treasureMap' },
  { to: '/practice', label: 'Practice', sprite: 'terminal' },
  { to: '/challenges', label: 'Battle', sprite: 'sword' },
  { to: '/profile', label: 'Hero', sprite: 'hero' },
]

export function MobileNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t-2 border-[var(--pixel-ink)] bg-[var(--color-surface)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {items.map(({ to, label, sprite }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2 font-pixel text-[11px] text-[var(--color-text-muted)]',
              isActive && 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className="flex h-6 items-end">
                <PixelSprite sprite={sprite} scale={sprite === 'hero' ? 1.5 : 2} className={cn(isActive && 'animate-pixel-bob')} />
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
