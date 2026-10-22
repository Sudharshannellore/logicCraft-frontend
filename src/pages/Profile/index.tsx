import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LevelBadge } from '@/components/gamification/LevelBadge'
import { XPBar } from '@/components/gamification/XPBar'
import { LeagueBadge } from '@/components/gamification/LeagueBadge'
import { StreakCard } from '@/components/gamification/StreakCard'
import { PageLoader } from '@/components/layout/PageLoader'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { useWalletStore } from '@/stores/walletStore'
import { PixelBar } from '@/components/pixel/PixelBar'
import { isSpriteName, type SpriteName } from '@/components/pixel/sprites'

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}m ${s}s`
}

const STARS: [number, number][] = [
  [8, 10],
  [26, 34],
  [44, 8],
  [72, 18],
  [88, 40],
  [60, 46],
  [14, 56],
  [92, 8],
]

const SKILL_COLORS = ['accent', 'info', 'warning', 'violet', 'error'] as const

function AttributeTile({ sprite, label, color, children }: { sprite: SpriteName; label: string; color: string; children: ReactNode }) {
  return (
    <div className="group flex items-center gap-3 border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] p-3 shadow-[3px_3px_0_var(--pixel-ink)]">
      <div
        className="pixel-corners flex h-12 w-12 shrink-0 items-center justify-center"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, var(--color-surface-elevated))` }}
      >
        <PixelSprite sprite={sprite} scale={2} className="group-hover:animate-pixel-bob" />
      </div>
      <div className="min-w-0">
        <p className="font-pixel text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
        <div className="font-pixel text-xl leading-tight" style={{ color }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { data: user } = useQuery({ queryKey: ['current-user'], queryFn: api.getCurrentUser })
  const totalXp = useWalletStore((s) => s.xp)
  const { data: achievements = [] } = useQuery({ queryKey: ['achievements'], queryFn: api.getAchievements })
  // The four most recent achievements this player has actually unlocked.
  const badges = achievements
    .filter((a) => a.unlocked)
    .sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''))
    .slice(0, 4)

  if (!user) return <PageLoader />

  const attributes: { label: string; value: string | number; sprite: SpriteName; color: string }[] = [
    { label: 'Problems Solved', value: user.stats.problemsSolved, sprite: 'terminal', color: 'var(--color-accent)' },
    { label: 'Challenges Won', value: user.stats.challengesWon, sprite: 'trophy', color: 'var(--color-warning)' },
    { label: 'Longest Streak', value: `${user.stats.longestStreak}d`, sprite: 'flame', color: 'var(--color-error)' },
    { label: 'Accuracy', value: `${user.stats.accuracy}%`, sprite: 'star', color: 'var(--color-info)' },
    { label: 'Avg Solve Time', value: formatDuration(user.stats.avgSolveTimeSeconds), sprite: 'lightning', color: 'var(--color-violet)' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Card className="mb-6 overflow-hidden border-2">
        <div className="flex flex-col sm:flex-row">
          {/* Portrait diorama */}
          <div className="relative flex h-56 shrink-0 items-end justify-center overflow-hidden bg-[linear-gradient(180deg,#08090b_0%,#1a1130_100%)] sm:h-auto sm:min-h-60 sm:w-64">
            {STARS.map(([x, y], i) => (
              <span
                key={i}
                className="animate-pixel-twinkle absolute h-1 w-1 bg-white"
                style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.23}s` }}
              />
            ))}
            <span className="absolute left-3 top-3 font-pixel text-[10px] uppercase tracking-widest text-white/50">Player 1</span>
            <div className="relative z-10 flex flex-col items-center">
              <PixelSprite sprite="hero" scale={8} className="animate-pixel-bob" title={`${user.username}'s character`} />
              <div className="h-2 w-64 bg-[var(--color-accent)]" />
              <div className="h-4 w-64 bg-[#3c8c18]" />
            </div>
          </div>

          <CardContent className="flex flex-1 flex-col justify-center gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <LevelBadge level={user.level} className="h-14 w-14" />
                <div>
                  <h1 className="text-3xl font-bold leading-none">{user.username}</h1>
                  <p className="mt-1 font-mono text-sm text-[var(--color-text-muted)]">{user.handle}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <LeagueBadge league={user.league} />
                <StreakCard days={user.streakDays} />
              </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-pixel text-sm text-[var(--color-text-secondary)]">
              <span>
                Class <span className="text-[var(--color-violet)]">Code Mage</span>
              </span>
              <span>
                Rank <span className="text-[var(--color-accent)]">#{user.rank}</span>
              </span>
            </div>
            <XPBar xp={totalXp} xpToNextLevel={user.xpToNextLevel} className="max-w-lg" />

            <div>
              <p className="mb-2 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Latest badges</p>
              {badges.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No badges yet — unlock achievements by learning, solving and keeping your streak.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      title={badge.title}
                      className="group pixel-corners flex h-11 w-11 items-center justify-center bg-[var(--color-surface-elevated)]"
                    >
                      <PixelSprite sprite={isSpriteName(badge.icon) ? badge.icon : 'medal'} scale={2} title={badge.title} className="group-hover:animate-pixel-bob" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      <h2 className="mb-3 text-lg">Attributes</h2>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {attributes.map(({ label, value, sprite, color }) => (
          <AttributeTile key={label} sprite={sprite} label={label} color={color}>
            {value}
          </AttributeTile>
        ))}
        <AttributeTile sprite="book" label="Languages" color="var(--color-text-primary)">
          <div className="mt-1 flex flex-wrap gap-1.5">
            {user.stats.languages.map((lang) => (
              <span
                key={lang}
                className="border-2 border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-2 py-0.5 text-xs leading-none"
              >
                {lang}
              </span>
            ))}
          </div>
        </AttributeTile>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skill Tree</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.skills.map((skill, i) => (
            <div key={skill.name}>
              <div className="mb-1.5 flex items-center justify-between font-pixel text-sm">
                <span className="text-[var(--color-text-primary)]">{skill.name}</span>
                <span className="text-[var(--color-text-muted)]">{skill.percent}%</span>
              </div>
              <PixelBar percent={skill.percent} segments={20} color={SKILL_COLORS[i % SKILL_COLORS.length]} label={`${skill.name} skill`} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
