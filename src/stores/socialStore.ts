import { useCallback, useEffect } from 'react'
import { create } from 'zustand'
import type { AddFriendResult, DuelStatus, DuelView, Player, SocialOverview } from '@/types'
import { api } from '@/services/api'
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
    let players = get().players
    if (directory) for (const p of directory) players = { ...players, [p.id]: p }
    const fromSocial = fromOverview(overview, withDuelPlayers(duels, players))
    set({
      ...fromSocial,
      duels: duels.map(toDuel),
      directory: directory ? directory.map((p) => p.id).filter((id) => id !== overview.myId) : get().directory,
      loaded: true,
    })
  },

  sendFriendRequest: async (rawId) => {
    const { result, overview } = await api.sendFriendRequest(rawId.trim())
    set(fromOverview(overview, get().players))
    return result
  },

  acceptRequest: async (playerId) => set(fromOverview(await api.acceptFriendRequest(playerId), get().players)),
  declineRequest: async (playerId) => set(fromOverview(await api.declineFriendRequest(playerId), get().players)),
  removeFriend: async (playerId) => set(fromOverview(await api.removeFriend(playerId), get().players)),

  sendDuel: async (input) => {
    const { duel, balance } = await api.createDuel(input)
    useWalletStore.getState().setBalance(balance)
    get().upsertDuel(duel)
    return true
  },

  acceptDuel: async (id) => {
    const { duel, balance } = await api.acceptDuel(id)
    useWalletStore.getState().setBalance(balance)
    get().upsertDuel(duel)
    return true
  },

  declineDuel: async (id) => {
    const { duel, balance } = await api.declineDuel(id)
    useWalletStore.getState().setBalance(balance)
    get().upsertDuel(duel)
  },

  cancelDuel: async (id) => {
    const { duel, balance } = await api.cancelDuel(id)
    useWalletStore.getState().setBalance(balance)
    get().upsertDuel(duel)
  },

  startDuel: async (id) => get().upsertDuel(await api.startDuel(id)),
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
