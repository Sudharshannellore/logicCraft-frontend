import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { PixelBar } from '@/components/pixel/PixelBar'
import type { SpriteName } from '@/components/pixel/sprites'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useAuthStore } from '@/stores/authStore'
import { signOut } from '@/services/auth'
import { useWalletStore } from '@/stores/walletStore'
import { cn } from '@/utils/cn'

export const navItems: { to: string; label: string; sprite: SpriteName }[] = [
  { to: '/dashboard', label: 'Dashboard', sprite: 'castle' },
  { to: '/learn', label: 'Learn', sprite: 'treasureMap' },
  { to: '/paths', label: 'Career Paths', sprite: 'compass' },
  { to: '/practice', label: 'Practice', sprite: 'terminal' },
  { to: '/challenges', label: 'Challenges', sprite: 'sword' },
  { to: '/friends', label: 'Friends', sprite: 'hero' },
  { to: '/leaderboard', label: 'Leaderboard', sprite: 'trophy' },
  { to: '/quests', label: 'Quests', sprite: 'scroll' },
  { to: '/achievements', label: 'Achievements', sprite: 'medal' },
  { to: '/resume', label: 'Resume Builder', sprite: 'resume' },
  { to: '/jobs', label: 'Job Board', sprite: 'briefcase' },
  { to: '/subscription', label: 'Get XP', sprite: 'crown' },
]

/** Pixel tooltip shown beside the icon rail when the sidebar is collapsed. */
function RailTooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap border-2 border-[var(--color-accent)] bg-[var(--color-surface)] px-2 py-1 font-pixel text-sm text-[var(--color-text-primary)] shadow-[3px_3px_0_var(--pixel-ink)] group-hover:block group-focus-visible:block"
    >
      {children}
    </span>
  )
}

interface NavItemProps {
  to: string
  label: string
  sprite: SpriteName
  collapsed: boolean
  spriteClass?: string
}

function NavItem({ to, label, sprite, collapsed, spriteClass }: NavItemProps) {
  // The collapsed rail scrolls and is edge-masked, which would clip a nested tooltip — so it's portalled to <body>.
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null)
  const showTip = (e: React.SyntheticEvent<HTMLElement>) => {
    if (!collapsed) return
    const r = e.currentTarget.getBoundingClientRect()
    setTip({ top: r.top + r.height / 2, left: r.right + 12 })
  }
  const hideTip = () => setTip(null)

  return (
    <NavLink
      to={to}
      onMouseEnter={showTip}
      onFocus={showTip}
      onMouseLeave={hideTip}
      onBlur={hideTip}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 py-1.5 font-pixel text-base text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]',
          collapsed ? 'justify-center px-0' : 'px-3',
          isActive && 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-selector"
              className="absolute -left-1 top-1/2 -translate-y-1/2 font-pixel text-sm text-[var(--color-accent)]"
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            >
              <span className="animate-caret">▶</span>
            </motion.span>
          )}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center">
            <PixelSprite
              sprite={sprite}
              scale={sprite === 'questBot' ? 1.5 : 2}
              fps={isActive && (sprite === 'questBot' || sprite === 'castle') ? 3 : 0}
              className={cn('transition-transform', isActive ? 'animate-pixel-bob' : 'group-hover:-translate-y-0.5', spriteClass)}
            />
          </span>
          <span className={cn('truncate', collapsed && 'sr-only')}>{label}</span>
          {collapsed &&
            tip &&
            createPortal(
              <span
                aria-hidden="true"
                className="pointer-events-none fixed z-[60] -translate-y-1/2 whitespace-nowrap border-2 border-[var(--color-accent)] bg-[var(--color-surface)] px-2 py-1 font-pixel text-sm text-[var(--color-text-primary)] shadow-[3px_3px_0_var(--pixel-ink)]"
                style={{ top: tip.top, left: tip.left }}
              >
                {label}
              </span>,
              document.body,
            )}
        </>
      )}
    </NavLink>
  )
}

function isEditable(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('input, textarea, select, [contenteditable="true"], .monaco-editor')
}

export function Sidebar() {
  const { collapsed, toggle } = useSidebarStore()
  const lifetimeXp = useWalletStore((s) => s.lifetimeXp)
  const currentUser = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const xpPercent = currentUser ? (lifetimeXp / currentUser.xpToNextLevel) * 100 : 0

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'b' && !isEditable(e.target)) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  if (!currentUser) return null // only rendered inside RequireAuth, so this is momentary at most

  return (
    <aside
      id="main-sidebar"
      className="pixel-scanlines sticky top-0 z-40 hidden h-dvh w-[var(--sidebar-w)] shrink-0 flex-col border-r-2 border-[var(--pixel-ink)] bg-[var(--color-surface)] transition-[width] duration-200 ease-out lg:flex"
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls="main-sidebar"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="group absolute -right-4 top-1/2 z-50 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] shadow-[0_2px_10px_rgba(0,0,0,0.5)] transition-[color,border-color,box-shadow] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:shadow-[0_0_0_3px_var(--color-accent-soft),0_2px_10px_rgba(0,0,0,0.5)] focus-visible:border-[var(--color-accent)] focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)] focus-visible:outline-none"
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 whitespace-nowrap border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 font-pixel text-xs text-[var(--color-text-secondary)] shadow-[3px_3px_0_var(--pixel-ink)] group-hover:block group-focus-visible:block"
        >
          {collapsed ? 'Expand' : 'Collapse'} · Ctrl+B
        </span>
      </button>

      <Link to="/" className={cn('flex h-16 shrink-0 items-center gap-2.5', collapsed ? 'justify-center' : 'px-5')} aria-label="Logicraft home">
        <PixelSprite sprite="questBot" scale={2} fps={3} />
        <span className={cn('whitespace-nowrap font-pixel text-xl', collapsed && 'sr-only')}>Logicraft</span>
      </Link>

      {collapsed ? (
        <div className="mx-auto mb-0.5 mt-2 h-0.5 w-8 bg-[var(--color-border-strong)]" aria-hidden="true" />
      ) : (
        <p className="whitespace-nowrap px-5 pb-0.5 pt-2 font-pixel text-[11px] uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Main Menu</p>
      )}

      <nav aria-label="Main" className={cn('pixel-scroll nav-fade min-h-0 flex-1 space-y-0.5 overflow-y-auto py-2', collapsed ? 'px-2' : 'px-3')}>
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <div className={cn(collapsed ? 'space-y-1.5 p-2' : 'p-3')}>
        {collapsed ? (
          <Link
            to="/profile"
            aria-label={`${currentUser.username}, level ${currentUser.level}, profile`}
            className="group relative flex flex-col items-center gap-1 border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] px-1 py-1.5 shadow-[3px_3px_0_var(--pixel-ink)] transition-colors hover:border-[var(--color-accent)]"
          >
            <div className="flex h-10 w-10 items-end justify-center overflow-hidden border-2 border-[var(--color-violet)] bg-[var(--color-violet-soft)]">
              <PixelSprite sprite="hero" scale={2.25} className="translate-y-1" />
            </div>
            <span className="font-pixel text-[11px] text-[var(--color-accent)]">LV {currentUser.level}</span>
            <RailTooltip>
              {currentUser.username} · {lifetimeXp.toLocaleString()} XP
            </RailTooltip>
          </Link>
        ) : (
          <div className="border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] p-2.5 shadow-[3px_3px_0_var(--pixel-ink)]">
            <div className="flex items-center gap-2.5">
              <Link to="/profile" className="group flex min-w-0 flex-1 items-center gap-2.5" title={`${lifetimeXp.toLocaleString()} / ${currentUser.xpToNextLevel.toLocaleString()} XP to next level`}>
                <div className="flex h-10 w-10 shrink-0 items-end justify-center overflow-hidden border-2 border-[var(--color-violet)] bg-[var(--color-violet-soft)] transition-colors group-hover:border-[var(--color-accent)]">
                  <PixelSprite sprite="hero" scale={2.25} className="translate-y-1" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-pixel text-sm group-hover:text-[var(--color-accent)]">{currentUser.username}</p>
                  <p className="font-pixel text-xs text-[var(--color-accent)]">LV {currentUser.level}</p>
                </div>
              </Link>
              <NavLink
                to="/settings"
                aria-label="Settings"
                title="Settings"
                className={({ isActive }) =>
                  cn(
                    'group flex h-9 w-9 shrink-0 items-center justify-center border-2 transition-colors',
                    isActive
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                      : 'border-[var(--color-border-strong)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-elevated)]',
                  )
                }
              >
                <PixelSprite sprite="gear" scale={2} className="group-hover:animate-gear-spin" />
              </NavLink>
              <button
                type="button"
                onClick={() => void signOut().then(() => navigate('/signin', { replace: true }))}
                aria-label="Sign out"
                title="Sign out"
                className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[var(--color-border-strong)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-error)] hover:text-[var(--color-error)]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <PixelBar percent={xpPercent} segments={10} size="sm" className="mt-2" label="Experience" />
          </div>
        )}
        {collapsed && <NavItem to="/settings" label="Settings" sprite="gear" collapsed spriteClass="group-hover:animate-gear-spin" />}
      </div>
    </aside>
  )
}
