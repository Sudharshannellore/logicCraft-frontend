import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LevelBadge } from '@/components/gamification/LevelBadge'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { AI_ANSWER_COST, useWalletStore } from '@/stores/walletStore'
import { useAuthStore } from '@/stores/authStore'

export function Topbar() {
  const xp = useWalletStore((s) => s.xp)
  const user = useAuthStore((s) => s.user)
  const streakDays = user?.streakDays ?? 0
  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  })

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b-2 border-[var(--pixel-ink)] bg-[var(--color-bg)]/85 px-4 backdrop-blur lg:px-6">
      <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
        <PixelSprite sprite="questBot" scale={2} />
        <span className="hidden font-pixel text-lg sm:inline">Logicraft</span>
      </Link>
      <div className="hidden font-pixel text-sm text-[var(--color-text-secondary)] lg:block">
        {'> '}{greeting}, <span className="text-[var(--color-text-primary)]">{user?.username.split(' ')[0] ?? 'Developer'}</span>
        <span className="animate-caret">_</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className="hidden items-center gap-1.5 border-2 border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-2.5 py-1 sm:flex"
          title={`${streakDays}-day streak`}
        >
          <PixelSprite sprite="flame" scale={1.5} fps={6} />
          <span className="font-pixel text-sm text-[var(--color-warning)]">{streakDays}</span>
        </div>
        <Link
          to="/subscription"
          className="group flex items-center gap-1.5 border-2 border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] py-1 pl-2.5 pr-1 transition-colors hover:border-[var(--color-accent)]"
          title={`XP — earn it by learning, practicing and challenges; spend it on Quest AI (${AI_ANSWER_COST} XP per answer). Click to get more.`}
        >
          <PixelSprite sprite="star" scale={1.25} />
          <span className="font-pixel text-sm text-[var(--color-accent)]">{xp.toLocaleString()} XP</span>
          <span aria-hidden className="flex h-5 w-5 items-center justify-center bg-[var(--color-accent)] font-pixel text-sm leading-none text-[#06120a] transition-transform group-hover:scale-110">+</span>
          <span className="sr-only">Get more XP</span>
        </Link>
        {user && <LevelBadge level={user.level} />}
        <Link
          to="/profile"
          aria-label="Your profile"
          className="flex h-10 w-10 items-end justify-center overflow-hidden border-2 border-[var(--color-violet)] bg-[var(--color-violet-soft)]"
        >
          <PixelSprite sprite="hero" scale={2} className="translate-y-1" />
        </Link>
      </div>
    </header>
  )
}
