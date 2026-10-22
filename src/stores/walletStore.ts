import { create } from 'zustand'
import type { XpBalance } from '@/types'
import { api } from '@/services/api'
import { queryClient } from '@/app/providers/QueryProvider'

/**
 * The player's XP, mirrored from the server. XP is Logicraft's single currency: the server earns and
 * spends it; every action that changes it returns the new balance, which lands here via `setBalance`.
 * `lifetimeXp` only ever grows and drives levels, so spending never costs a level.
 */

/** Must match the server's price (GET /config/economy). */
export const AI_ANSWER_COST = 10

interface WalletState extends XpBalance {
  claimedMilestones: number[]
  loaded: boolean
  load: () => Promise<void>
  setBalance: (balance: XpBalance | null | undefined) => void
  reset: () => void
}

const initial = { xp: 0, lifetimeXp: 0, claimedMilestones: [] as number[], loaded: false }

export const useWalletStore = create<WalletState>((set, get) => ({
  ...initial,

  load: async () => {
    const wallet = await api.getWallet()
    get().setBalance(wallet) // also refreshes level, rank and leaderboards when earned XP changed
    set({ claimedMilestones: wallet.claimedMilestones, loaded: true })
  },

  setBalance: (balance) => {
    if (!balance) return
    const earned = balance.lifetimeXp !== get().lifetimeXp
    set({ xp: balance.xp, lifetimeXp: balance.lifetimeXp })
    // Earned XP can change level, league, rank and leaderboards.
    if (earned) {
      void queryClient.invalidateQueries({ queryKey: ['current-user'] })
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    }
  },

  reset: () => set(initial),
}))
