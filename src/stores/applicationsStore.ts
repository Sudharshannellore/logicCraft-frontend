import { useEffect } from 'react'
import { create } from 'zustand'
import type { ApplicationStatus, JobApplication, ResumeData } from '@/types'
import { api } from '@/services/api'
import { useWalletStore } from './walletStore'

/**
 * The player's job application tracker, stored on the server. Applying happens on the job board's site;
 * this keeps what was prepared (resume, cover note) and where each application stands.
 */

interface ApplicationsState {
  applications: JobApplication[]
  loaded: boolean
  load: () => Promise<void>
  /** Tracks an application being made on the board's site. Free. */
  track: (
    jobId: string,
    input: { resumeId: string; resume?: ResumeData; coverNote: string; tailored: boolean; aiXpSpent: number },
  ) => Promise<JobApplication>
  setStatus: (id: string, status: ApplicationStatus) => Promise<void>
  reset: () => void
}

export const useApplicationsStore = create<ApplicationsState>((set) => ({
  applications: [],
  loaded: false,

  load: async () => set({ applications: await api.getApplications(), loaded: true }),

  track: async (jobId, input) => {
    const { application, balance } = await api.applyToJob(jobId, input)
    useWalletStore.getState().setBalance(balance)
    set((s) => ({ applications: [application, ...s.applications] }))
    return application
  },

  setStatus: async (id, status) => {
    const updated = await api.updateApplication(id, status)
    set((s) => ({ applications: s.applications.map((a) => (a.id === id ? updated : a)) }))
  },

  reset: () => set({ applications: [], loaded: false }),
}))

/** Loads the player's applications once per session. */
export function useApplications() {
  const { applications, loaded, load } = useApplicationsStore()
  useEffect(() => {
    if (!loaded) void load().catch(() => undefined)
  }, [loaded, load])
  return applications
}

export const APPLICATION_STATUSES: Record<ApplicationStatus, { label: string; tone: 'info' | 'violet' | 'success' | 'neutral' }> = {
  applied: { label: 'Applied', tone: 'info' },
  interviewing: { label: 'Interviewing', tone: 'violet' },
  offer: { label: 'Offer', tone: 'success' },
  rejected: { label: 'Not this time', tone: 'neutral' },
}
