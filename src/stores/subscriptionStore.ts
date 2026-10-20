import { useEffect } from 'react'
import { create } from 'zustand'
import type { Billing, Purchase, Subscription, SubscriptionState, XpPlan } from '@/types'
import { api } from '@/services/api'
import { useWalletStore } from './walletStore'

/**
 * XP subscriptions and one-time packs, stored on the server. Demo checkout: no payment is taken — the
 * server credits the XP. Monthly drops that came due are paid out whenever the state is loaded.
 */

interface SubscriptionStoreState {
  subscription: Subscription | null
  purchases: Purchase[]
  loaded: boolean
  load: () => Promise<void>
  subscribe: (planId: XpPlan['id'], billing: Billing) => Promise<void>
  cancel: () => Promise<void>
  resume: () => Promise<void>
  buyPack: (packId: string) => Promise<void>
  reset: () => void
}

function apply(state: SubscriptionState) {
  useWalletStore.getState().setBalance(state.balance)
  return { subscription: state.subscription, purchases: state.purchases, loaded: true }
}

export const useSubscriptionStore = create<SubscriptionStoreState>((set) => ({
  subscription: null,
  purchases: [],
  loaded: false,
  load: async () => set(apply(await api.getSubscription())),
  subscribe: async (planId, billing) => set(apply(await api.subscribe(planId, billing))),
  cancel: async () => set(apply(await api.cancelSubscription())),
  resume: async () => set(apply(await api.resumeSubscription())),
  buyPack: async (packId) => set(apply(await api.buyPack(packId))),
  reset: () => set({ subscription: null, purchases: [], loaded: false }),
}))

export function useSubscriptionState() {
  const loaded = useSubscriptionStore((s) => s.loaded)
  const load = useSubscriptionStore((s) => s.load)
  useEffect(() => {
    if (!loaded) void load().catch(() => undefined)
  }, [loaded, load])
  return loaded
}

export const formatInr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`
