import { queryClient } from '@/app/providers/QueryProvider'
import { api } from '@/services/api'
import { useApplicationsStore } from '@/stores/applicationsStore'
import { useAuthStore } from '@/stores/authStore'
import { useResumeStore } from '@/stores/resumeStore'
import { useSocialStore } from '@/stores/socialStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useWalletStore } from '@/stores/walletStore'

/** Signing in and out, and loading what every signed-in screen needs. */

function forgetPlayerData() {
  queryClient.clear()
  useWalletStore.getState().reset()
  useSocialStore.getState().reset()
  useResumeStore.getState().clear()
  useApplicationsStore.getState().reset()
  useSubscriptionStore.getState().reset()
}

export async function signIn(email: string, password: string) {
  const session = await api.login(email.trim(), password)
  forgetPlayerData() // a different account may have been signed in on this browser
  useAuthStore.getState().setSession(session)
  await bootstrapSession()
  return session.user
}

export async function signUp(username: string, email: string, password: string) {
  const session = await api.register(username.trim(), email.trim(), password)
  forgetPlayerData()
  useAuthStore.getState().setSession(session)
  await bootstrapSession()
  return session.user
}

export async function signOut() {
  const refreshToken = useAuthStore.getState().refreshToken
  useAuthStore.getState().clear()
  forgetPlayerData()
  if (refreshToken) await api.logout(refreshToken).catch(() => undefined)
}

/** Loads the profile and wallet for a (possibly restored) session. */
export async function bootstrapSession() {
  const [user] = await Promise.all([api.getCurrentUser(), useWalletStore.getState().load()])
  useAuthStore.getState().setUser(user)
  queryClient.setQueryData(['current-user'], user)
}
