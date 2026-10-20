import { useEffect } from 'react'
import { create } from 'zustand'
import type { ResumeData, ResumeLibrary, ResumeTemplateId, SavedResume } from '@/types'
import { api } from '@/services/api'
import { useWalletStore } from './walletStore'

/**
 * The learner's saved resumes, shared by the Resume Builder and the Job Board — stored on the server.
 * Edits show instantly and are saved after a short pause. One slot is free; extra slots and premium
 * templates are bought once with XP (the server charges).
 */

export const FREE_RESUME_SLOTS = 1
export const RESUME_SLOT_COST = 100
export const MAX_RESUMES = 8
const SAVE_DELAY_MS = 700

interface ResumeState {
  resumes: SavedResume[]
  activeId: string
  extraSlots: number
  unlockedTemplates: ResumeTemplateId[]
  loaded: boolean
  saving: boolean
  saveError: string | null

  load: () => Promise<void>
  /** Edits the active resume. */
  update: (fn: (draft: ResumeData) => ResumeData) => void
  updateById: (id: string, fn: (draft: ResumeData) => ResumeData) => void
  reset: () => Promise<void>
  select: (id: string) => void
  /** Adds a resume (blank or a copy of the active one), buying a slot with XP when all are used. */
  create: (source: 'starter' | 'duplicate') => Promise<boolean>
  rename: (id: string, title: string) => void
  remove: (id: string) => Promise<void>
  setTemplate: (templateId: ResumeTemplateId) => void
  unlockTemplate: (templateId: ResumeTemplateId) => Promise<boolean>
  clear: () => void
}

const timers = new Map<string, number>()

function applyLibrary(library: ResumeLibrary) {
  useWalletStore.getState().setBalance(library.balance)
  return {
    resumes: library.resumes,
    activeId: library.activeId,
    extraSlots: library.extraSlots,
    unlockedTemplates: library.unlockedTemplates,
    loaded: true,
  }
}

export const slotCount = (s: Pick<ResumeState, 'extraSlots'>) => FREE_RESUME_SLOTS + s.extraSlots
export const selectActive = (s: Pick<ResumeState, 'resumes' | 'activeId'>) => s.resumes.find((r) => r.id === s.activeId) ?? s.resumes[0]

export const useResumeStore = create<ResumeState>((set, get) => {
  const save = async (id: string) => {
    timers.delete(id)
    const resume = get().resumes.find((r) => r.id === id)
    if (!resume) return
    set({ saving: true })
    try {
      await api.saveResumeData(id, resume.data)
      set({ saving: timers.size > 0, saveError: null })
    } catch {
      set({ saving: false, saveError: "Couldn't save your latest changes — they'll retry on your next edit." })
    }
  }

  const flush = async () => {
    const pending = [...timers.keys()]
    for (const id of pending) window.clearTimeout(timers.get(id))
    await Promise.all(pending.map(save))
  }

  return {
    resumes: [],
    activeId: '',
    extraSlots: 0,
    unlockedTemplates: [],
    loaded: false,
    saving: false,
    saveError: null,

    load: async () => set(applyLibrary(await api.getResumes())),

    update: (fn) => get().updateById(get().activeId, fn),

    updateById: (id, fn) => {
      set((s) => ({ resumes: s.resumes.map((r) => (r.id === id ? { ...r, data: fn(r.data), updatedAt: Date.now() } : r)) }))
      window.clearTimeout(timers.get(id))
      timers.set(id, window.setTimeout(() => void save(id), SAVE_DELAY_MS))
    },

    reset: async () => {
      const id = get().activeId
      window.clearTimeout(timers.get(id))
      timers.delete(id)
      const fresh = await api.resetResume(id)
      set((s) => ({ resumes: s.resumes.map((r) => (r.id === id ? fresh : r)) }))
    },

    select: (id) => {
      if (!get().resumes.some((r) => r.id === id)) return
      set({ activeId: id })
      void api.activateResume(id).catch(() => undefined)
    },

    create: async (source) => {
      await flush() // a duplicate must copy what's on screen
      set(applyLibrary(await api.createResume(source)))
      return true
    },

    rename: (id, title) => {
      set((s) => ({ resumes: s.resumes.map((r) => (r.id === id ? { ...r, title: title.slice(0, 40) } : r)) }))
      void api.patchResume(id, { title: title.slice(0, 40) }).catch(() => undefined)
    },

    remove: async (id) => {
      window.clearTimeout(timers.get(id))
      timers.delete(id)
      set(applyLibrary(await api.deleteResume(id)))
    },

    setTemplate: (templateId) => {
      const { activeId, unlockedTemplates } = get()
      if (!unlockedTemplates.includes(templateId)) return
      set((s) => ({ resumes: s.resumes.map((r) => (r.id === activeId ? { ...r, templateId, updatedAt: Date.now() } : r)) }))
      void api.patchResume(activeId, { templateId }).catch(() => undefined)
    },

    unlockTemplate: async (templateId) => {
      if (get().unlockedTemplates.includes(templateId)) return true
      const library = await api.unlockTemplate(templateId)
      set({ unlockedTemplates: library.unlockedTemplates })
      useWalletStore.getState().setBalance(library.balance)
      return true
    },

    clear: () => {
      for (const t of timers.values()) window.clearTimeout(t)
      timers.clear()
      set({ resumes: [], activeId: '', extraSlots: 0, unlockedTemplates: [], loaded: false, saving: false, saveError: null })
    },
  }
})

/** Loads the resume library once per session; components render once `loaded` is true. */
export function useResumeLibrary() {
  const loaded = useResumeStore((s) => s.loaded)
  const load = useResumeStore((s) => s.load)
  useEffect(() => {
    if (!loaded) void load().catch(() => undefined)
  }, [loaded, load])
  return loaded
}
