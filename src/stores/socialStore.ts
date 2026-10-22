import { useCallback, useEffect } from 'react'
import { create } from 'zustand'
import type { AddFriendResult, DuelStatus, DuelView, Player, SocialOverview } from '@/types'
import { api } from '@/services/api'
import { playSound, type SoundName } from '@/services/sound'
import { useWalletStore } from './walletStore'

/**
 * Friends and friend duels, mirrored from the server. Every action goes through the API; the other
 * player's side (accepting, solving) happens on their own device, so social pages poll while open
 * (`useSocialSync`).
 */

/** Must match the server (GET /config/economy). */
export const DUEL_WIN_BONUS = 40
export const DUEL_STAKES = [0, 25, 50, 100] as const
export const DUEL_TIME_LIMITS = [10, 20, 30] as const
const POLL_MS = 3000
/** Duel states that end a duel, and so may have paid out or refunded XP. */
const ENDED: ReadonlySet<DuelStatus> = new Set(['won', 'lost', 'draw', 'declined', 'cancelled'])

export type { AddFriendResult, DuelStatus }

/** A duel from my side. `mySeconds` is undefined until I've finished; null = I ran out of time. */
export interface Duel extends Omit<DuelView, 'mySeconds' | 'startedAt' | 'finishedAt'> {
  mySeconds?: number | null
  startedAt?: number
  finishedAt?: number
}

export function toDuel(view: DuelView): Duel {
  return {
    ...view,
    startedAt: view.startedAt ?? undefined,
    finishedAt: view.finishedAt ?? undefined,
    mySeconds: view.myFinished ? (view.mySeconds ?? null) : undefined,
  }
}

interface SocialState {
  myId: string
  /** Friend player ids, oldest friendship first. */
  friends: string[]
  incomingRequests: { playerId: string; at: number }[]
  outgoingRequests: { playerId: string; at: number }[]
  duels: Duel[]
  /** Every player we know about: friends, requesters, duel rivals and the public directory. */
  players: Record<string, Player>
  /** Players to suggest on the "Add friend" tab. */
  directory: string[]
  loaded: boolean

  refresh: () => Promise<void>
  sendFriendRequest: (playerId: string) => Promise<AddFriendResult>
  acceptRequest: (playerId: string) => Promise<void>
  declineRequest: (playerId: string) => Promise<void>
  removeFriend: (playerId: string) => Promise<void>
  sendDuel: (input: { friendId: string; problemSlug: string; timeLimitMinutes: number; stake: number }) => Promise<boolean>
  acceptDuel: (id: string) => Promise<boolean>
  declineDuel: (id: string) => Promise<void>
  cancelDuel: (id: string) => Promise<void>
  /** Opens my board: my clock starts now. */
  startDuel: (id: string) => Promise<Duel>
  /** Gives up, or my clock ran out. */
  forfeitDuel: (id: string) => Promise<Duel>
  /** Records a duel the server returned (e.g. from a code submission). */
  upsertDuel: (view: DuelView) => Duel
  reset: () => void
}

const initial = {
  myId: '',
  friends: [] as string[],
  incomingRequests: [] as { playerId: string; at: number }[],
  outgoingRequests: [] as { playerId: string; at: number }[],
  duels: [] as Duel[],
  players: {} as Record<string, Player>,
  directory: [] as string[],
  loaded: false,
}

function fromOverview(overview: SocialOverview, players: Record<string, Player>) {
  const known = { ...players }
  for (const p of overview.friends) known[p.id] = p
  for (const r of [...overview.incomingRequests, ...overview.outgoingRequests]) known[r.playerId] = r.player
  return {
    myId: overview.myId,
    friends: overview.friends.map((p) => p.id),
    incomingRequests: overview.incomingRequests.map((r) => ({ playerId: r.playerId, at: r.at })),
    outgoingRequests: overview.outgoingRequests.map((r) => ({ playerId: r.playerId, at: r.at })),
    players: known,
  }
}

/** The sound for the most important thing the other player did between two refreshes, if anything. */
function socialEventSound(
  previous: Pick<SocialState, 'friends' | 'incomingRequests' | 'duels'>,
  overview: SocialOverview,
  duels: DuelView[],
  before: Map<string, DuelStatus>,
): SoundName | null {
  const changed = (d: DuelView, to: DuelStatus) => before.has(d.id) && before.get(d.id) !== to && d.status === to
  if (duels.some((d) => changed(d, 'won'))) return 'victory'
  if (duels.some((d) => changed(d, 'lost'))) return 'defeat'
  const knownDuels = new Set(previous.duels.map((d) => d.id))
  if (duels.some((d) => !knownDuels.has(d.id) && d.direction === 'received' && d.status === 'pending')) return 'duel'
  if (duels.some((d) => d.direction === 'sent' && changed(d, 'active'))) return 'duel'
  const knownRequests = new Set(previous.incomingRequests.map((r) => r.playerId))
  if (overview.incomingRequests.some((r) => !knownRequests.has(r.playerId))) return 'notify'
  if (overview.friends.some((p) => !previous.friends.includes(p.id))) return 'friend'
  if (duels.some((d) => changed(d, 'draw') || changed(d, 'declined') || changed(d, 'cancelled'))) return 'notify'
  return null
}

function withDuelPlayers(views: DuelView[], players: Record<string, Player>) {
  const known = { ...players }
  for (const v of views) if (v.friend) known[v.friendId] = v.friend
  return known
}

export const useSocialStore = create<SocialState>((set, get) => ({
  ...initial,

  refresh: async () => {
    const [overview, duels, directory] = await Promise.all([
      api.getSocial(),
      api.getDuels(),
      get().directory.length ? Promise.resolve(null) : api.getPlayers(50),
    ])
    const previous = get()
    const before = new Map(previous.duels.map((d) => [d.id, d.status]))
    let players = get().players
    if (directory) for (const p of directory) players = { ...players, [p.id]: p }
    const fromSocial = fromOverview(overview, withDuelPlayers(duels, players))
    set({
      ...fromSocial,
      duels: duels.map(toDuel),
      directory: directory ? directory.map((p) => p.id).filter((id) => id !== overview.myId) : get().directory,
      loaded: true,
    })
    // The server settles a duel when it's read, so winnings and refunds reach the wallet without any response
    // carrying the new balance: fetch it when a duel has just ended.
    if (duels.some((d) => before.has(d.id) && before.get(d.id) !== d.status && ENDED.has(d.status))) {
      void useWalletStore.getState().load().catch(() => undefined)
    }
    // What the other player did since the last look (my own actions already played their sound).
    if (previous.loaded) {
      const sound = socialEventSound(previous, overview, duels, before)
      if (sound) playSound(sound)
    }
  },

  sendFriendRequest: async (rawId) => {
    const { result, overview } = await api.sendFriendRequest(rawId.trim())
    set(fromOverview(overview, get().players))
    playSound(result === 'sent' ? 'success' : result === 'accepted-incoming' ? 'friend' : 'error')
    return result
  },

  acceptRequest: async (playerId) => {
    set(fromOverview(await api.acceptFriendRequest(playerId), get().players))
    playSound('friend')
  },
  declineRequest: async (playerId) => {
    set(fromOverview(await api.declineFriendRequest(playerId), get().players))
    playSound('remove')
  },
  removeFriend: async (playerId) => {
    set(fromOverview(await api.removeFriend(playerId), get().players))
    playSound('remove')
  },

  sendDuel: async (input) => {
    const { duel, balance } = await api.createDuel(input)
    useWalletStore.getState().setBalance(balance)
    get().upsertDuel(duel)
    playSound('duel')
    return true
  },

  acceptDuel: async (id) => {
    const { duel, balance } = await api.acceptDuel(id)
    useWalletStore.getState().setBalance(balance)
    get().upsertDuel(duel)
    playSound('duel')
    return true
  },

  declineDuel: async (id) => {
    const { duel, balance } = await api.declineDuel(id)
    useWalletStore.getState().setBalance(balance)
    get().upsertDuel(duel)
    playSound('remove')
  },

  cancelDuel: async (id) => {
    const { duel, balance } = await api.cancelDuel(id)
    useWalletStore.getState().setBalance(balance)
    get().upsertDuel(duel)
    playSound('remove')
  },

  startDuel: async (id) => {
    const duel = get().upsertDuel(await api.startDuel(id))
    playSound('start')
    return duel
  },
  forfeitDuel: async (id) => get().upsertDuel(await api.forfeitDuel(id)),

  upsertDuel: (view) => {
    const duel = toDuel(view)
    set((s) => ({
      duels: s.duels.some((d) => d.id === duel.id) ? s.duels.map((d) => (d.id === duel.id ? duel : d)) : [duel, ...s.duels],
      players: view.friend ? { ...s.players, [view.friendId]: view.friend } : s.players,
    }))
    return duel
  },

  reset: () => set(initial),
}))

/** Looks a player up by id among everyone the social store knows. */
export function useFindPlayer() {
  const players = useSocialStore((s) => s.players)
  return useCallback((id: string) => players[id.trim().toLowerCase()] ?? players[id], [players])
}

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/** Keeps friends, requests and duels fresh while a social page is open. */
export function useSocialSync() {
  const refresh = useSocialStore((s) => s.refresh)
  useEffect(() => {
    const tick = () => void refresh().catch(() => undefined)
    tick()
    const id = window.setInterval(tick, POLL_MS)
    return () => window.clearInterval(id)
  }, [refresh])
}
