import { create } from 'zustand'
import type { XpBalance } from '@/types'
import { api } from '@/services/api'
import { queryClient } from '@/app/providers/QueryProvider'
import { playSound } from '@/services/sound'

/**
 * The player's XP, mirrored from the server. XP is Logicraft's single currency: the server earns and
 * spends it; every action that changes it returns the new balance, which lands here via `setBalance`.
 * `xp` is the total XP shown everywhere: it drives level, league, rank and the leaderboards.
 */

/** Must match the server's price (GET /config/economy). */
export const AI_ANSWER_COST = 10

/** Must match the server (app/domain/progression.py): reaching level n takes 25·n² XP. */
const levelFor = (xp: number) => Math.max(1, Math.floor(Math.sqrt(Math.floor(Math.max(0, xp) / 25))))

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
    const { xp: before, loaded } = get()
    const earned = balance.xp !== before
    set({ xp: balance.xp, lifetimeXp: balance.lifetimeXp })
    // The first load isn't an event; every later change is a coin, a spend, or a level up.
    if (loaded && earned) playSound(levelFor(balance.xp) > levelFor(before) ? 'levelUp' : balance.xp > before ? 'coin' : 'spend')
    // XP changes level, league, rank and leaderboards.
    if (earned) {
      void queryClient.invalidateQueries({ queryKey: ['current-user'] })
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    }
  },

  reset: () => set(initial),
}))
