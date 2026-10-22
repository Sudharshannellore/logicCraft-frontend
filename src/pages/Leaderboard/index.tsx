import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Globe, Users, CalendarDays, CalendarRange } from 'lucide-react'
import { api, type LeaderboardScope } from '@/services/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/layout/PageLoader'
import { EmptyStateArt } from '@/components/illustrations/EmptyStateArt'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import type { LeaderboardEntry } from '@/types'
import { cn } from '@/utils/cn'

type Tab = LeaderboardScope

const tabs: { id: Tab; label: string; icon: typeof Globe }[] = [
  { id: 'global', label: 'Global', icon: Globe },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'weekly', label: 'Weekly', icon: CalendarDays },
  { id: 'monthly', label: 'Monthly', icon: CalendarRange },
]

const TAB_CAPTIONS: Record<Tab, string> = {
  global: 'All-time XP across every player.',
  friends: 'You and your friends, by all-time XP.',
  weekly: 'XP earned in the last 7 days.',
  monthly: 'XP earned in the last 30 days.',
}

function rankAccent(rank: number) {
  if (rank === 1) return { color: '#f0c550', sprite: 'crown' as const }
  if (rank === 2) return { color: '#c7ccd4', sprite: 'trophy' as const }
  if (rank === 3) return { color: '#c08552', sprite: 'medal' as const }
  return null
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const accent = rankAccent(entry.rank)
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-[var(--radius-md)] border border-transparent px-3 py-3 transition-colors',
        entry.isCurrentUser && 'border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)]',
      )}
    >
      <div className="flex w-16 shrink-0 items-center justify-start gap-1.5">
        {accent && <PixelSprite sprite={accent.sprite} scale={2} className={cn(entry.rank === 1 && 'animate-pixel-bob')} />}
        <span className="font-pixel text-base" style={{ color: accent?.color }}>
          #{entry.rank}
        </span>
      </div>

      <Avatar initials={entry.avatarInitials} color={entry.avatarColor} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{entry.username}</p>
          {entry.isCurrentUser && <Badge variant="accent">You</Badge>}
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">Level {entry.level}</p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="font-pixel text-base text-[var(--color-text-primary)]">{entry.xp.toLocaleString()} XP</p>
        <p className="text-xs text-[var(--color-text-muted)]">{entry.winRate}% win rate</p>
      </div>

      <div className="flex shrink-0 gap-0.5 text-base">
        {entry.badges.map((badge, i) => (
          <span key={i}>{badge}</span>
        ))}
      </div>
    </div>
  )
}

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>('global')
  const { data: rows, isLoading } = useQuery({ queryKey: ['leaderboard', tab], queryFn: () => api.getLeaderboard(tab), staleTime: 10_000, refetchInterval: 30_000 })

  if (isLoading || !rows) return <PageLoader />

  // Only me on the friends board: nudge toward adding friends.
  const showComingSoon = tab === 'friends' && rows.length <= 1
  const caption = TAB_CAPTIONS[tab]

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <PixelSprite sprite="trophy" scale={3} className="animate-pixel-hover" />
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">See how you stack up against the community.</p>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors',
              tab === id
                ? 'bg-[var(--color-accent)] text-[#06120a]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {showComingSoon ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <EmptyStateArt className="h-28 w-36" />
            <p className="font-semibold">No friends on the board yet</p>
            <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">
              Add friends by their Player ID to compare progress head-to-head.
            </p>
            <Link to="/friends?tab=add" className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[#06120a]">
              Add friends
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-1">
            <p className="mb-2 text-xs text-[var(--color-text-muted)]">{caption}</p>
            {rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">No XP earned in this period yet.</p>
            ) : (
              rows.map((entry) => <LeaderboardRow key={entry.userId} entry={entry} />)
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
