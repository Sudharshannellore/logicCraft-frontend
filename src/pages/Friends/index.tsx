import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Copy, Search, Swords, UserMinus, UserPlus, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonVariants } from '@/components/ui/Button'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import type { SpriteName } from '@/components/pixel/sprites'
import type { Player } from '@/types'
import { PageLoader } from '@/components/layout/PageLoader'
import { errorMessage } from '@/services/api/client'
import { UUID_PATTERN, useFindPlayer, useSocialStore, useSocialSync, type AddFriendResult, type Duel } from '@/stores/socialStore'
import { cn } from '@/utils/cn'

const RESULT_TEXT: Record<AddFriendResult, { text: string; ok: boolean }> = {
  sent: { text: 'Friend request sent! It shows under Requests until they accept.', ok: true },
  'accepted-incoming': { text: 'They had already sent you a request — you are now friends!', ok: true },
  invalid: { text: "That doesn't look like a Player ID. It has 36 characters, like 1a2b3c4d-…", ok: false },
  self: { text: "That's your own Player ID.", ok: false },
  'not-found': { text: 'No player has that ID. Check it and try again.', ok: false },
  'already-friends': { text: "You're already friends.", ok: false },
  'already-sent': { text: 'Request already sent — waiting for them to accept.', ok: false },
}

const TABS = ['friends', 'requests', 'add'] as const
type Tab = (typeof TABS)[number]

const STATUS = ['All', 'Online', 'Offline'] as const
const DUEL_FILTERS = [
  { id: 'all', label: 'Any record' },
  { id: 'open', label: 'Open duel' },
  { id: 'beaten', label: "I've beaten" },
  { id: 'rivals', label: 'Beat me' },
  { id: 'never', label: 'Never dueled' },
] as const
const SORTS = [
  { id: 'online', label: 'Online first' },
  { id: 'name', label: 'Name A–Z' },
  { id: 'level', label: 'Highest level' },
  { id: 'duels', label: 'Most duels' },
  { id: 'record', label: 'Best record vs them' },
] as const
type DuelFilter = (typeof DUEL_FILTERS)[number]['id']
type Sort = (typeof SORTS)[number]['id']

const leagueTier = (p: Player) => p.league.split(' ')[0]

function duelStats(duels: Duel[], playerId: string) {
  const mine = duels.filter((d) => d.friendId === playerId)
  const wins = mine.filter((d) => d.status === 'won').length
  const losses = mine.filter((d) => d.status === 'lost').length
  const draws = mine.filter((d) => d.status === 'draw').length
  return { total: wins + losses + draws, wins, losses, open: mine.some((d) => d.status === 'pending' || d.status === 'active') }
}

function useCopy(text: string) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(t)
  }, [copied])
  const copy = () => navigator.clipboard?.writeText(text).then(() => setCopied(true), () => setCopied(false))
  return { copied, copy }
}

function OnlineDot({ online, className }: { online: boolean; className?: string }) {
  return (
    <span
      className={cn('h-2.5 w-2.5 border-2 border-[var(--color-surface)]', online ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-muted)]', className)}
      title={online ? 'Online' : 'Offline'}
    />
  )
}

/* ---------------- Header pieces ---------------- */

function PlayerIdChip() {
  const myId = useSocialStore((s) => s.myId)
  const { copied, copy } = useCopy(myId)
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy your Player ID"
      className="group flex items-center gap-2 border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-left transition-colors hover:border-[var(--color-accent)]"
    >
      <span className="min-w-0">
        <span className="block font-pixel text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Your Player ID</span>
        <span className="block font-mono text-xs text-[var(--color-text-primary)]">
          {myId.slice(0, 8)}…{myId.slice(-4)}
        </span>
      </span>
      <span className="flex h-7 w-7 items-center justify-center text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]">
        {copied ? <Check className="h-4 w-4 text-[var(--color-accent)]" /> : <Copy className="h-4 w-4" />}
      </span>
    </button>
  )
}

function StatTile({ sprite, label, value, tone }: { sprite: SpriteName; label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="flex items-center gap-3 border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <PixelSprite sprite={sprite} scale={2.5} />
      <div>
        <p className={cn('font-pixel text-xl leading-tight', tone)}>{value}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      </div>
    </div>
  )
}

/* ---------------- Friends tab ---------------- */

const selectClass =
  'border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] px-2.5 py-2 font-pixel text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]'

function FriendCard({ player }: { player: Player }) {
  const removeFriend = useSocialStore((s) => s.removeFriend)
  const duels = useSocialStore((s) => s.duels)
  const [confirm, setConfirm] = useState(false)
  const st = duelStats(duels, player.id)

  useEffect(() => {
    if (!confirm) return
    const t = window.setTimeout(() => setConfirm(false), 3000)
    return () => window.clearTimeout(t)
  }, [confirm])

  return (
    <li className="group relative flex flex-col border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 shadow-[4px_4px_0_var(--pixel-ink)] transition-transform duration-100 hover:-translate-y-0.5">
      <button
        type="button"
        onClick={() => (confirm ? removeFriend(player.id) : setConfirm(true))}
        aria-label={confirm ? `Confirm removing ${player.username}` : `Remove ${player.username}`}
        title={confirm ? 'Click again to remove' : 'Remove friend'}
        className={cn(
          'absolute right-3 top-3 flex items-center gap-1 p-1 font-pixel text-[11px] transition-opacity',
          confirm ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)] opacity-60 hover:text-[var(--color-error)] hover:opacity-100',
        )}
      >
        <UserMinus className="h-4 w-4" /> {confirm && 'Remove?'}
      </button>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar initials={player.avatarInitials} color={player.avatarColor} size="md" />
          <OnlineDot online={player.online} className="absolute -bottom-0.5 -right-0.5" />
        </div>
        <div className="min-w-0 pr-8">
          <p className="truncate font-pixel text-base">{player.username}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Lv {player.level} · {player.league}
          </p>
          <p className={cn('mt-0.5 font-pixel text-[11px]', player.online ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]')}>
            {player.online ? 'Online now' : 'Offline'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 border-2 border-[var(--color-border)] bg-[var(--color-bg)] text-center">
        <div className="py-2">
          <p className="font-pixel text-base text-[var(--color-success)]">{st.wins}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Wins</p>
        </div>
        <div className="border-x-2 border-[var(--color-border)] py-2">
          <p className="font-pixel text-base text-[var(--color-error)]">{st.losses}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Losses</p>
        </div>
        <div className="py-2">
          <p className="font-pixel text-base">{st.total}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Duels</p>
        </div>
      </div>

      {st.open ? (
        <Link to="/challenges" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 w-full')}>
          <Swords className="h-3.5 w-3.5" /> Duel in progress
        </Link>
      ) : (
        <Link to={`/challenges?duelWith=${player.id}`} className={cn(buttonVariants({ variant: 'pixelViolet', size: 'sm' }), 'mt-4 w-full')}>
          <Swords className="h-3.5 w-3.5" /> Challenge
        </Link>
      )}
    </li>
  )
}

function FriendsTab({ onAdd, onRequests }: { onAdd: () => void; onRequests: () => void }) {
  const friends = useSocialStore((s) => s.friends)
  const duels = useSocialStore((s) => s.duels)
  const incoming = useSocialStore((s) => s.incomingRequests)
  const findPlayer = useFindPlayer()
  const friendPlayers = useMemo(() => friends.map(findPlayer).filter((p): p is Player => !!p), [friends, findPlayer])

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<(typeof STATUS)[number]>('All')
  const [league, setLeague] = useState('All')
  const [duelFilter, setDuelFilter] = useState<DuelFilter>('all')
  const [sort, setSort] = useState<Sort>('online')

  const leagues = useMemo(() => [...new Set(friendPlayers.map(leagueTier))].sort(), [friendPlayers])
  const filtersOn = query.trim() !== '' || status !== 'All' || league !== 'All' || duelFilter !== 'all'
  const clearFilters = () => {
    setQuery('')
    setStatus('All')
    setLeague('All')
    setDuelFilter('all')
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const stats = new Map(friendPlayers.map((p) => [p.id, duelStats(duels, p.id)]))
    return friendPlayers
      .filter((p) => !q || p.username.toLowerCase().includes(q) || p.id.startsWith(q))
      .filter((p) => status === 'All' || (status === 'Online') === p.online)
      .filter((p) => league === 'All' || leagueTier(p) === league)
      .filter((p) => {
        const st = stats.get(p.id)!
        if (duelFilter === 'open') return st.open
        if (duelFilter === 'beaten') return st.wins > 0
        if (duelFilter === 'rivals') return st.losses > 0
        if (duelFilter === 'never') return st.total === 0 && !st.open
        return true
      })
      .sort((a, b) => {
        const sa = stats.get(a.id)!
        const sb = stats.get(b.id)!
        if (sort === 'name') return a.username.localeCompare(b.username)
        if (sort === 'level') return b.level - a.level
        if (sort === 'duels') return sb.total - sa.total || a.username.localeCompare(b.username)
        if (sort === 'record') return sb.wins - sb.losses - (sa.wins - sa.losses) || a.username.localeCompare(b.username)
        return Number(b.online) - Number(a.online) || a.username.localeCompare(b.username)
      })
  }, [friendPlayers, duels, query, status, league, duelFilter, sort])

  if (friendPlayers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 border-2 border-dashed border-[var(--color-border-strong)] py-20 text-center">
        <PixelSprite sprite="hero" scale={5} className="animate-pixel-bob" />
        <div>
          <p className="font-pixel text-lg">No friends yet</p>
          <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">Share your Player ID, or paste a friend's, to start dueling.</p>
        </div>
        <Button variant="pixel" onClick={onAdd}>
          <UserPlus className="h-4 w-4" /> Add a friend
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {incoming.length > 0 && (
        <button
          type="button"
          onClick={onRequests}
          className="flex w-full items-center gap-3 border-2 border-[var(--color-violet)] bg-[var(--color-violet-soft)] px-4 py-2.5 text-left transition-colors hover:bg-[var(--color-violet)]/20"
        >
          <PixelSprite sprite="scroll" scale={2} />
          <span className="flex-1 text-sm">
            <span className="font-pixel text-[var(--color-violet)]">{findPlayer(incoming[0].playerId)?.username ?? 'Someone'}</span>
            {incoming.length > 1 ? ` and ${incoming.length - 1} more want` : ' wants'} to be your friend.
          </span>
          <span className="font-pixel text-xs text-[var(--color-violet)]">Review ▶</span>
        </button>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1 lg:max-w-md">
          <span className="sr-only">Search friends</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or Player ID…"
            className="w-full border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] py-2 pl-9 pr-3 text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
          />
        </label>
        <div role="group" aria-label="Status" className="flex border-2 border-[var(--color-border-strong)] p-0.5">
          {STATUS.map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={status === o}
              onClick={() => setStatus(o)}
              className={cn('px-3 py-1.5 font-pixel text-xs transition-colors', status === o ? 'bg-[var(--color-accent)] text-[#06120a]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]')}
            >
              {o}
            </button>
          ))}
        </div>
        <select value={league} onChange={(e) => setLeague(e.target.value)} className={selectClass} aria-label="League">
          <option value="All">All leagues</option>
          {leagues.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select value={duelFilter} onChange={(e) => setDuelFilter(e.target.value as DuelFilter)} className={selectClass} aria-label="Duel record">
          {DUEL_FILTERS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={cn(selectClass, 'lg:ml-auto')} aria-label="Sort friends">
          {SORTS.map((o) => (
            <option key={o.id} value={o.id}>
              Sort: {o.label}
            </option>
          ))}
        </select>
      </div>
      <p className="flex items-center gap-3 font-pixel text-xs text-[var(--color-text-muted)]" aria-live="polite">
        Showing {shown.length} of {friendPlayers.length} friends
        {filtersOn && (
          <button type="button" onClick={clearFilters} className="text-[var(--color-accent)] hover:underline">
            Clear filters
          </button>
        )}
      </p>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border-2 border-dashed border-[var(--color-border-strong)] py-14 text-center">
          <PixelSprite sprite="compass" scale={4} />
          <p className="font-pixel">No friends match these filters</p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Friends list">
          {shown.map((p) => (
            <FriendCard key={p.id} player={p} />
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------------- Requests tab ---------------- */

function RequestRow({ player, children }: { player: Player; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-4 border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4">
      <div className="relative">
        <Avatar initials={player.avatarInitials} color={player.avatarColor} size="md" />
        <OnlineDot online={player.online} className="absolute -bottom-0.5 -right-0.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-pixel text-base">{player.username}</p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Lv {player.level} · {player.league}
        </p>
      </div>
      {children}
    </li>
  )
}

function RequestsTab({ onAdd }: { onAdd: () => void }) {
  const incoming = useSocialStore((s) => s.incomingRequests)
  const outgoing = useSocialStore((s) => s.outgoingRequests)
  const acceptRequest = useSocialStore((s) => s.acceptRequest)
  const declineRequest = useSocialStore((s) => s.declineRequest)
  const findPlayer = useFindPlayer()

  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 border-2 border-dashed border-[var(--color-border-strong)] py-20 text-center">
        <PixelSprite sprite="scroll" scale={4} />
        <p className="font-pixel text-lg">No pending requests</p>
        <Button variant="outline" onClick={onAdd}>
          <UserPlus className="h-4 w-4" /> Add a friend
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section aria-label="Friend requests">
        <h2 className="mb-1 text-lg">Received</h2>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">Players who want to add you.</p>
        {incoming.length === 0 ? (
          <p className="border-2 border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">Nothing new.</p>
        ) : (
          <ul className="space-y-3">
            {incoming.map((r) => {
              const p = findPlayer(r.playerId)
              return p ? (
                <RequestRow key={r.playerId} player={p}>
                  <div className="flex gap-2">
                    <Button size="sm" variant="pixel" onClick={() => acceptRequest(p.id)} aria-label={`Accept ${p.username}`}>
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => declineRequest(p.id)} aria-label={`Decline ${p.username}`}>
                      <X className="h-3.5 w-3.5" /> Decline
                    </Button>
                  </div>
                </RequestRow>
              ) : null
            })}
          </ul>
        )}
      </section>
      <section aria-label="Sent requests">
        <h2 className="mb-1 text-lg">Sent</h2>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">Waiting for them to accept.</p>
        {outgoing.length === 0 ? (
          <p className="border-2 border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">No requests waiting.</p>
        ) : (
          <ul className="space-y-3">
            {outgoing.map((r) => {
              const p = findPlayer(r.playerId)
              return p ? (
                <RequestRow key={r.playerId} player={p}>
                  <span className="font-pixel text-xs text-[var(--color-text-muted)]">Waiting…</span>
                </RequestRow>
              ) : null
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

/* ---------------- Add friend tab ---------------- */

function AddFriendTab() {
  const myId = useSocialStore((s) => s.myId)
  const friends = useSocialStore((s) => s.friends)
  const sendFriendRequest = useSocialStore((s) => s.sendFriendRequest)
  const directory = useSocialStore((s) => s.directory)
  const findPlayer = useFindPlayer()
  const { copied, copy } = useCopy(myId)
  const [value, setValue] = useState('')
  const [result, setResult] = useState<AddFriendResult | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const preview = UUID_PATTERN.test(value.trim()) ? findPlayer(value) : undefined
  const suggestions = directory
    .filter((id) => !friends.includes(id))
    .map(findPlayer)
    .filter((p): p is Player => !!p)
    .slice(0, 4)

  useEffect(() => input.current?.focus(), [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      const r = await sendFriendRequest(value)
      setResult(r)
      if (RESULT_TEXT[r].ok) setValue('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section aria-label="Add a friend" className="border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 shadow-[4px_4px_0_var(--pixel-ink)]">
        <div className="flex items-center gap-3">
          <div className="pixel-corners flex h-12 w-12 items-center justify-center bg-[var(--color-accent-soft)]">
            <UserPlus className="h-6 w-6 text-[var(--color-accent)]" />
          </div>
          <div>
            <h2 className="text-lg">Add by Player ID</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Ask your friend for the ID on their Friends page.</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            ref={input}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setResult(null)
            }}
            aria-label="Friend's Player ID"
            placeholder="Paste a Player ID, e.g. 1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"
            spellCheck={false}
            className="w-full border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2.5 font-mono text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
          />
          {preview && !result && (
            <div className="flex items-center gap-3 border-2 border-[var(--color-accent)]/50 bg-[var(--color-accent-soft)] p-3">
              <Avatar initials={preview.avatarInitials} color={preview.avatarColor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-pixel text-sm">{preview.username}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Lv {preview.level} · {preview.league}
                </p>
              </div>
              <span className="font-pixel text-xs text-[var(--color-accent)]">Player found</span>
            </div>
          )}
          <Button type="submit" variant="pixel" className="w-full" disabled={!value.trim() || sending}>
            {sending ? 'Sending…' : 'Send friend request'}
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-sm text-[var(--color-error)]">
            {error}
          </p>
        )}
        {result && (
          <p role="status" className={cn('mt-3 font-pixel text-sm', RESULT_TEXT[result].ok ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]')}>
            {RESULT_TEXT[result].text}
          </p>
        )}

        {suggestions.length > 0 && (
          <details className="mt-6 border-t-2 border-[var(--color-border)] pt-4">
            <summary className="cursor-pointer font-pixel text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">Other players on Logicraft</summary>
            <ul className="mt-3 space-y-2">
              {suggestions.map((p) => (
                <li key={p.id} className="flex items-center gap-3 text-xs">
                  <span className="w-28 shrink-0 truncate font-pixel text-[var(--color-text-secondary)]">{p.username}</span>
                  <code className="min-w-0 flex-1 truncate font-mono text-[var(--color-text-muted)]">{p.id}</code>
                  <button
                    type="button"
                    onClick={() => {
                      setValue(p.id)
                      setResult(null)
                    }}
                    className="font-pixel text-[var(--color-accent)] hover:underline"
                  >
                    Use
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section aria-label="Your Player ID" className="flex flex-col border-2 border-[var(--color-accent)] bg-[linear-gradient(160deg,var(--color-accent-soft),transparent_70%)] p-6 shadow-[4px_4px_0_var(--pixel-ink)]">
        <div className="flex items-center gap-3">
          <div className="pixel-corners flex h-12 w-12 items-center justify-center bg-[var(--color-accent-soft)]">
            <PixelSprite sprite="hero" scale={2.5} className="animate-pixel-bob" />
          </div>
          <div>
            <h2 className="text-lg">Share your Player ID</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Friends paste it to add you.</p>
          </div>
        </div>
        <code className="mt-5 block break-all border-2 border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-3 text-center font-mono text-base tracking-wide text-[var(--color-text-primary)]" data-testid="my-player-id">
          {myId}
        </code>
        <Button variant="pixel" className="mt-3 w-full" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied!' : 'Copy Player ID'}
        </Button>
        <ol className="mt-6 space-y-3">
          {[
            ['1', 'Share your Player ID', 'Send it to a friend in any chat.'],
            ['2', 'They add you', 'Your friend pastes it in Add friend — or you paste theirs.'],
            ['3', 'Duel!', 'Challenge each other to coding problems and stake XP.'],
          ].map(([n, title, text]) => (
            <li key={n} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--color-accent)] font-pixel text-sm text-[#06120a]">{n}</span>
              <span>
                <span className="block font-pixel text-sm">{title}</span>
                <span className="block text-xs text-[var(--color-text-secondary)]">{text}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-auto pt-5 text-xs text-[var(--color-text-muted)]">Given to you when you signed up. It never changes.</p>
      </section>
    </div>
  )
}

/* ---------------- Page ---------------- */

export default function Friends() {
  useSocialSync()
  const friends = useSocialStore((s) => s.friends)
  const duels = useSocialStore((s) => s.duels)
  const incoming = useSocialStore((s) => s.incomingRequests)
  const outgoing = useSocialStore((s) => s.outgoingRequests)
  const loaded = useSocialStore((s) => s.loaded)
  const findPlayer = useFindPlayer()
  const [params, setParams] = useSearchParams()
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'friends'
  const setTab = (t: Tab) => setParams(t === 'friends' ? {} : { tab: t }, { replace: true })

  const friendPlayers = friends.map(findPlayer).filter((p): p is Player => !!p)
  const online = friendPlayers.filter((p) => p.online).length
  const wins = duels.filter((d) => d.status === 'won').length
  const losses = duels.filter((d) => d.status === 'lost').length
  const pending = incoming.length + outgoing.length

  const tabs: { id: Tab; label: string; count?: number; alert?: boolean }[] = [
    { id: 'friends', label: 'Friends', count: friendPlayers.length },
    { id: 'requests', label: 'Requests', count: pending, alert: incoming.length > 0 },
    { id: 'add', label: 'Add friend' },
  ]

  if (!loaded) return <PageLoader />

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <div className="pixel-corners flex h-16 w-16 shrink-0 items-center justify-center bg-[var(--color-accent-soft)]">
          <PixelSprite sprite="hero" scale={3.5} className="animate-pixel-hover" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl">Friends</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Add friends by Player ID, then challenge them to coding duels.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlayerIdChip />
          <Button variant="pixel" onClick={() => setTab('add')}>
            <UserPlus className="h-4 w-4" /> Add friend
          </Button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile sprite="hero" label="Friends" value={friendPlayers.length} />
        <StatTile sprite="heart" label="Online now" value={online} tone="text-[var(--color-success)]" />
        <StatTile
          sprite="sword"
          label="Duel record"
          value={
            <>
              <span className="text-[var(--color-success)]">{wins}W</span> <span className="text-[var(--color-text-muted)]">·</span>{' '}
              <span className="text-[var(--color-error)]">{losses}L</span>
            </>
          }
        />
        <StatTile sprite="scroll" label="Pending requests" value={pending} tone={incoming.length ? 'text-[var(--color-violet)]' : undefined} />
      </div>

      <div role="tablist" aria-label="Friends sections" className="mb-6 flex gap-1 overflow-x-auto border-b-2 border-[var(--color-border)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-0.5 flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 font-pixel text-sm transition-colors',
              tab === t.id ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={cn('min-w-5 px-1.5 text-center text-[11px]', t.alert ? 'bg-[var(--color-violet)] text-[#140b2e]' : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]')}>
                {t.count}
              </span>
            )}
          </button>
        ))}
        <Link to="/challenges" className="ml-auto hidden shrink-0 items-center gap-1.5 px-3 font-pixel text-xs sm:flex text-[var(--color-text-secondary)] hover:text-[var(--color-violet)]">
          <Swords className="h-3.5 w-3.5" /> Friend duels
        </Link>
      </div>

      <div role="tabpanel">
        {tab === 'friends' && <FriendsTab onAdd={() => setTab('add')} onRequests={() => setTab('requests')} />}
        {tab === 'requests' && <RequestsTab onAdd={() => setTab('add')} />}
        {tab === 'add' && <AddFriendTab />}
      </div>
    </div>
  )
}
