import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Clock, Swords, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, difficultyVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PixelSprite } from '@/components/pixel/PixelSprite'
import { useQuery } from '@tanstack/react-query'
import type { Player } from '@/types'
import { api } from '@/services/api'
import { errorMessage } from '@/services/api/client'
import { playSound } from '@/services/sound'
import { DUEL_STAKES, DUEL_TIME_LIMITS, DUEL_WIN_BONUS, useFindPlayer, useSocialStore } from '@/stores/socialStore'
import { useWalletStore } from '@/stores/walletStore'
import { cn } from '@/utils/cn'

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 font-pixel text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">{children}</p>
}

const chip = (on: boolean) =>
  cn(
    'border-2 px-3 py-1.5 font-pixel text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40',
    on ? 'border-[var(--color-violet)] bg-[var(--color-violet-soft)] text-[var(--color-violet)]' : 'border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]',
  )

/** Pick a friend, a coding problem, a time limit and an optional XP stake, then send the challenge. */
export function NewDuelDialog({ initialFriendId, onClose, onSent }: { initialFriendId?: string; onClose: () => void; onSent: () => void }) {
  const friends = useSocialStore((s) => s.friends)
  const sendDuel = useSocialStore((s) => s.sendDuel)
  const xp = useWalletStore((s) => s.xp)
  const findPlayer = useFindPlayer()
  const friendPlayers = friends.map(findPlayer).filter((p): p is Player => !!p)
  const { data: problems = [] } = useQuery({ queryKey: ['problems'], queryFn: api.getProblems })

  const [friendId, setFriendId] = useState(initialFriendId && friends.includes(initialFriendId) ? initialFriendId : friendPlayers[0]?.id)
  const [problemSlug, setProblemSlug] = useState<string | undefined>()
  const chosenSlug = problemSlug ?? problems[0]?.slug
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState<number>(20)
  const [stake, setStake] = useState<number>(25)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const friend = friendId ? findPlayer(friendId) : undefined
  const canSend = !!friend && !!chosenSlug && xp >= stake && !sending

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="New friend duel"
        tabIndex={-1}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="pixel-scroll relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto border-2 border-[var(--color-violet)] bg-[var(--color-surface)] p-5 shadow-[6px_6px_0_var(--pixel-ink)] outline-none sm:p-6"
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          <X className="h-5 w-5" />
        </button>
        <h2 className="flex items-center gap-2 text-xl">
          <Swords className="h-5 w-5 text-[var(--color-violet)]" /> Challenge a friend
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Both of you solve the same problem. The fastest correct solution wins.</p>

        <div className="mt-5 space-y-5">
          <div>
            <Label>Opponent</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {friendPlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={friendId === p.id}
                  onClick={() => setFriendId(p.id)}
                  className={cn('flex items-center gap-3 border-2 p-2 text-left transition-colors', friendId === p.id ? 'border-[var(--color-violet)] bg-[var(--color-violet-soft)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]')}
                >
                  <Avatar initials={p.avatarInitials} color={p.avatarColor} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-pixel text-sm">{p.username}</span>
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      Lv {p.level} · {p.online ? 'Online' : 'Offline'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Coding problem</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {problems.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  aria-pressed={chosenSlug === p.slug}
                  onClick={() => setProblemSlug(p.slug)}
                  className={cn('flex items-center justify-between gap-2 border-2 px-3 py-2 text-left transition-colors', chosenSlug === p.slug ? 'border-[var(--color-violet)] bg-[var(--color-violet-soft)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]')}
                >
                  <span className="font-pixel text-sm">{p.title}</span>
                  <Badge variant={difficultyVariant(p.difficulty)} className="capitalize">
                    {p.difficulty}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Time limit</Label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Time limit">
                {DUEL_TIME_LIMITS.map((m) => (
                  <button key={m} type="button" aria-pressed={limit === m} onClick={() => setLimit(m)} className={chip(limit === m)}>
                    <Clock className="mr-1 inline h-3 w-3" />
                    {m} min
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>XP stake (each)</Label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="XP stake">
                {DUEL_STAKES.map((v) => (
                  <button key={v} type="button" aria-pressed={stake === v} disabled={v > xp} onClick={() => setStake(v)} className={chip(stake === v)}>
                    {v === 0 ? 'Friendly' : `${v} XP`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 border-2 border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm text-[var(--color-text-secondary)]">
            <PixelSprite sprite="trophy" scale={2} />
            <p>
              Winner gets{' '}
              <span className="font-pixel text-[var(--color-accent)]">
                {stake > 0 ? `${stake * 2} XP (both stakes) + ` : ''}
                {DUEL_WIN_BONUS} XP bonus
              </span>
              . A draw returns the stakes. {stake > 0 && `Your ${stake} XP is held until the duel ends — and returned if you cancel before it starts.`}
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-[var(--color-error)]">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="pixelViolet"
            disabled={!canSend}
            onClick={async () => {
              if (!friend || !chosenSlug) return
              setSending(true)
              setError(null)
              try {
                if (await sendDuel({ friendId: friend.id, problemSlug: chosenSlug, timeLimitMinutes: limit, stake })) onSent()
              } catch (e) {
                setError(errorMessage(e))
                setSending(false)
                playSound('error')
              }
            }}
          >
            <Swords className="h-4 w-4" /> {sending ? 'Sending…' : 'Send challenge'}{friend ? ` to ${friend.username.split(' ')[0]}` : ''}
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}
