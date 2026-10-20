import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { QuestCard } from '@/components/gamification/QuestCard'
import { StreakRewards } from '@/components/economy/StreakRewards'
import { PageLoader } from '@/components/layout/PageLoader'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { cn } from '@/utils/cn'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Mon-first week strip; days since Monday up to today count toward the streak (capped by streakDays). */
function buildWeek(streakDays: number) {
  const todayIndex = (new Date().getDay() + 6) % 7
  return DAY_LABELS.map((label, i) => {
    const daysAgo = todayIndex - i
    return {
      label,
      isToday: daysAgo === 0,
      isFuture: daysAgo < 0,
      // Today stays "pending" until the quest is done; earlier days are lit if the streak reaches back that far.
      lit: daysAgo > 0 && daysAgo <= streakDays,
    }
  })
}

export default function Quests() {
  const { data: quest } = useQuery({ queryKey: ['daily-quest'], queryFn: api.getDailyQuest })
  const { data: user } = useQuery({ queryKey: ['current-user'], queryFn: api.getCurrentUser })

  if (!quest || !user) return <PageLoader />

  const week = buildWeek(user.streakDays)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="pixel-corners flex h-14 w-14 shrink-0 items-center justify-center bg-[var(--color-warning)]/15">
          <PixelSprite sprite="scroll" scale={3} className="animate-pixel-hover" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Daily Quests</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            You're on a <span className="font-pixel text-[var(--color-warning)]">{user.streakDays}-day</span> streak — keep it
            alive by finishing today's quest.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <PixelSprite sprite="flame" scale={1} fps={6} />
            This week
          </CardTitle>
          <span className="font-pixel text-xs text-[var(--color-text-muted)]">{user.streakDays} days total</span>
        </CardHeader>
        <CardContent>
          <ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {week.map((day) => (
              <li
                key={day.label}
                aria-label={`${day.label}: ${day.isToday ? 'today' : day.lit ? 'streak kept' : day.isFuture ? 'upcoming' : 'missed'}`}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center gap-1 border-2',
                  day.isToday
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-[3px_3px_0_var(--pixel-ink)]'
                    : day.lit
                      ? 'border-[var(--color-warning)]/50 bg-[var(--color-warning)]/10'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)]',
                  day.isFuture && 'opacity-40',
                )}
              >
                <span
                  className={cn(
                    'font-pixel text-[10px] uppercase sm:text-xs',
                    day.isToday ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]',
                  )}
                >
                  {day.isToday ? 'Today' : day.label}
                </span>
                <span className="flex h-7 items-center">
                  {day.lit ? (
                    <PixelSprite sprite="flame" scale={2} />
                  ) : day.isToday ? (
                    <span className="animate-pixel-twinkle font-pixel text-lg leading-none text-[var(--color-accent)]">?</span>
                  ) : (
                    <span className="h-2 w-2 bg-[var(--color-border-strong)]" />
                  )}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <QuestCard quest={quest} />

      <StreakRewards streakDays={user.streakDays} className="mt-6" />
    </div>
  )
}
