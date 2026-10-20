import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Award } from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardContent } from '@/components/ui/Card'
import { PixelBar } from '@/components/pixel/PixelBar'
import { AchievementBadge } from '@/components/gamification/AchievementBadge'
import { EmptyStateArt } from '@/components/illustrations/EmptyStateArt'
import { PageLoader } from '@/components/layout/PageLoader'
import { cn } from '@/utils/cn'

type Filter = 'all' | 'unlocked' | 'locked'

export default function Achievements() {
  const { data: achievements } = useQuery({ queryKey: ['achievements'], queryFn: api.getAchievements })
  const [filter, setFilter] = useState<Filter>('all')

  const unlockedCount = useMemo(() => achievements?.filter((a) => a.unlocked).length ?? 0, [achievements])

  if (!achievements) return <PageLoader />

  const filtered = achievements.filter((a) => {
    if (filter === 'unlocked') return a.unlocked
    if (filter === 'locked') return !a.unlocked
    return true
  })

  const percent = achievements.length === 0 ? 0 : Math.round((unlockedCount / achievements.length) * 100)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Award className="h-6 w-6 text-[var(--color-warning)]" />
          Achievements
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Collect badges as you level up your coding skills.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">
              {unlockedCount} of {achievements.length} unlocked
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">Keep going to unlock the rest.</p>
          </div>
          <PixelBar percent={percent} segments={8} className="sm:w-64" label="Achievements unlocked" />
        </CardContent>
      </Card>

      <div className="mb-6 flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 w-fit">
        {(['all', 'unlocked', 'locked'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-[var(--radius-sm)] px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              filter === f
                ? 'bg-[var(--color-accent)] text-[#06120a]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <EmptyStateArt className="h-28 w-36" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Nothing here yet. Solve more problems and win challenges to earn new badges.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((achievement, i) => (
            <AchievementBadge key={achievement.id} achievement={achievement} delay={(i % 8) * 0.05} />
          ))}
        </div>
      )}
    </div>
  )
}
