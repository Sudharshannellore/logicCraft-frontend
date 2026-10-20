import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Clock, Swords, UserPlus } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { NewDuelDialog } from './NewDuelDialog'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { DUEL_WIN_BONUS, formatDuration, useFindPlayer, useSocialStore, useSocialSync, type Duel } from '@/stores/socialStore'
import { useWalletStore } from '@/stores/walletStore'
import { cn } from '@/utils/cn'

const RESULT: Record<string, { label: string; variant: 'success' | 'error' | 'neutral' | 'warning' }> = {
  won: { label: 'Won', variant: 'success' },
  lost: { label: 'Lost', variant: 'error' },
  draw: { label: 'Draw', variant: 'warning' },
  declined: { label: 'Declined', variant: 'neutral' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
}

function DuelRow({ duel }: { duel: Duel }) {
  const acceptDuel = useSocialStore((s) => s.acceptDuel)
  const declineDuel = useSocialStore((s) => s.declineDuel)
  const cancelDuel = useSocialStore((s) => s.cancelDuel)
  const xp = useWalletStore((s) => s.xp)
  const findPlayer = useFindPlayer()
  const { data: problems = [] } = useQuery({ queryKey: ['problems'], queryFn: api.getProblems })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const friend = duel.friend ?? findPlayer(duel.friendId)
  const problem = problems.find((p) => p.slug === duel.problemSlug)
  if (!friend || !problem) return null

  const act = (action: (id: string) => Promise<unknown>) => async () => {
    setBusy(true)
    setError(null)
    try {
      await action(duel.id)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const incoming = duel.direction === 'received' && duel.status === 'pending'
  const waiting = duel.direction === 'sent' && duel.status === 'pending'
  const active = duel.status === 'active'
  const result = RESULT[duel.status]

  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-3 border-2 p-3',
        incoming ? 'border-[var(--color-violet)] bg-[var(--color-violet-soft)]' : active ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-border)]',
      )}
    >
      <Avatar initials={friend.avatarInitials} color={friend.avatarColor} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="font-pixel text-sm">
          {incoming ? `${friend.username} challenged you` : `vs ${friend.username}`}
          <span className="text-[var(--color-text-secondary)]"> · {problem.title}</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-3 text-xs text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {duel.timeLimitMinutes} min
          </span>
          <span>{duel.stake ? `${duel.stake} XP stake` : 'Friendly'}</span>
          {result && duel.mySeconds !== undefined && (
            <span>
              You {duel.mySeconds === null ? 'ran out of time' : formatDuration(duel.mySeconds)} · {friend.username.split(' ')[0]}{' '}
              {duel.friendSeconds === null ? "didn't finish" : formatDuration(duel.friendSeconds)}
            </span>
          )}
        </p>
      </div>

      {incoming && (
        <div className="flex gap-1.5">
          <Button size="sm" variant="pixelViolet" disabled={busy || xp < duel.stake} onClick={act(acceptDuel)} title={xp < duel.stake ? `Needs ${duel.stake} XP` : undefined}>
            Accept{duel.stake ? ` · ${duel.stake} XP` : ''}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={act(declineDuel)}>
            Decline
          </Button>
        </div>
      )}
      {waiting && (
        <div className="flex items-center gap-2">
          <span className="font-pixel text-xs text-[var(--color-text-muted)]">Waiting for {friend.username.split(' ')[0]}…</span>
          <Button size="sm" variant="ghost" disabled={busy} onClick={act(cancelDuel)}>
            Cancel
          </Button>
        </div>
      )}
      {active && duel.mySeconds !== undefined && (
        <span className="font-pixel text-xs text-[var(--color-text-muted)]">
          Your time is in · waiting for {friend.username.split(' ')[0]}…
        </span>
      )}
      {active && duel.mySeconds === undefined && (
        <Link to={`/practice/${duel.problemSlug}?duel=${duel.id}`} className={buttonVariants({ variant: 'pixel', size: 'sm' })}>
          <Swords className="h-3.5 w-3.5" /> {duel.startedAt ? 'Resume duel' : 'Start duel'}
        </Link>
      )}
      {error && (
        <p role="alert" className="w-full text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}
      {result && (
        <div className="flex items-center gap-2">
          {duel.status === 'won' && <span className="font-pixel text-xs text-[var(--color-accent)]">+{duel.stake * 2 + DUEL_WIN_BONUS} XP</span>}
          <Badge variant={result.variant}>{result.label}</Badge>
        </div>
      )}
    </li>
  )
}

/** Friend duels on the Challenges page: incoming challenges, live duels and recent results. */
export function FriendDuels() {
  useSocialSync()
  const duels = useSocialStore((s) => s.duels)
  const friends = useSocialStore((s) => s.friends)
  const [params, setParams] = useSearchParams()
  const duelWith = params.get('duelWith') ?? undefined
  const [open, setOpen] = useState(false)

  // Opened from a friend's "Challenge" button: start the dialog with that friend picked.
  useEffect(() => {
    if (duelWith) setOpen(true)
  }, [duelWith])

  const close = () => {
    setOpen(false)
    if (duelWith) setParams({}, { replace: true })
  }

  const live = duels.filter((d) => d.status === 'pending' || d.status === 'active')
  const history = duels.filter((d) => !(d.status === 'pending' || d.status === 'active')).slice(0, 5)
  const record = { won: duels.filter((d) => d.status === 'won').length, lost: duels.filter((d) => d.status === 'lost').length }

  return (
    <section aria-label="Friend duels" className="mb-8 border-2 border-[var(--color-violet)] bg-[var(--color-surface)] shadow-[4px_4px_0_var(--pixel-ink)]">
      <header className="flex flex-wrap items-center gap-3 border-b-2 border-[var(--color-border)] bg-[linear-gradient(90deg,var(--color-violet-soft),transparent_70%)] px-4 py-3 sm:px-5">
        <div className="flex items-end gap-1">
          <PixelSprite sprite="hero" scale={2.5} />
          <PixelSprite sprite="sword" scale={2} className="animate-pixel-bob" />
          <PixelSprite sprite="hero" scale={2.5} flip />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl">Friend Duels</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Send a coding problem to a friend — fastest correct solution wins. Record: <span className="text-[var(--color-success)]">{record.won}W</span> ·{' '}
            <span className="text-[var(--color-error)]">{record.lost}L</span>
          </p>
        </div>
        <Link to="/friends" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <UserPlus className="h-3.5 w-3.5" /> Friends ({friends.length})
        </Link>
        <Button variant="pixelViolet" onClick={() => setOpen(true)} disabled={friends.length === 0}>
          <Swords className="h-4 w-4" /> New duel
        </Button>
      </header>

      <div className="space-y-4 p-4 sm:p-5">
        {friends.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            Add a friend by their Player ID to start dueling.{' '}
            <Link to="/friends" className="text-[var(--color-accent)] hover:underline">
              Add friends
            </Link>
          </p>
        ) : live.length === 0 && history.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">No duels yet — hit “New duel” to challenge a friend.</p>
        ) : null}

        {live.length > 0 && (
          <ul className="space-y-2" aria-label="Open duels">
            {live.map((d) => (
              <DuelRow key={d.id} duel={d} />
            ))}
          </ul>
        )}
        {history.length > 0 && (
          <div>
            <p className="mb-2 font-pixel text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">Recent results</p>
            <ul className="space-y-2" aria-label="Duel history">
              {history.map((d) => (
                <DuelRow key={d.id} duel={d} />
              ))}
            </ul>
          </div>
        )}
      </div>

      {open && <NewDuelDialog initialFriendId={duelWith} onClose={close} onSent={close} />}
    </section>
  )
}
