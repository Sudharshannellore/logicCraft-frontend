import { Trophy } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { formatDuration } from '@/stores/socialStore'
import type { LiveChallenge } from '@/types'
import { cn } from '@/utils/cn'

export function StatusBadge({ challenge }: { challenge: LiveChallenge }) {
  const { status, seconds } = challenge.me
  if (challenge.locked) return <Badge variant="neutral">Locked</Badge>
  if (status === 'won') return <Badge variant="success">Won{seconds != null ? ` in ${formatDuration(seconds)}` : ''}</Badge>
  if (status === 'in_progress') return <Badge variant="warning">In progress</Badge>
  if (status === 'timed_out') return <Badge variant="error">Time's up</Badge>
  if (status === 'ended') return <Badge variant="neutral">Ended</Badge>
  return null
}

export function FastestBoard({ challenge, className }: { challenge: LiveChallenge; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 flex items-center gap-1.5 font-pixel text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
        <Trophy className="h-3.5 w-3.5" /> Fastest
      </p>
      {challenge.fastest.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          {challenge.gradable ? 'Nobody has won yet. Be the first on the board.' : 'Times are only recorded for languages graded here.'}
        </p>
      ) : (
        <ol className="space-y-1.5">
          {challenge.fastest.map((r) => (
            <li key={r.playerId} className={cn('flex items-center gap-2 text-sm', r.isYou && 'text-[var(--color-accent)]')}>
              <span className="w-5 font-pixel text-xs text-[var(--color-text-muted)]">#{r.rank}</span>
              <Avatar initials={r.avatarInitials} color={r.avatarColor} size="sm" className="h-7 w-7" />
              <span className="min-w-0 flex-1 truncate">{r.isYou ? 'You' : r.username}</span>
              <span className="font-pixel tabular-nums">{formatDuration(r.seconds)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
