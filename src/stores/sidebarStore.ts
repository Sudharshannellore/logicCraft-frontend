import { create } from 'zustand'

const STORAGE_KEY = 'codequest-sidebar-collapsed'

function readInitial(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

interface SidebarState {
  collapsed: boolean
  toggle: () => void
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  collapsed: typeof window === 'undefined' ? false : readInitial(),
  toggle: () => {
    const collapsed = !get().collapsed
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      // Storage unavailable (private mode etc.) — the toggle still works for this session.
    }
    set({ collapsed })
  },
}))

export const SIDEBAR_WIDTH = { expanded: 240, collapsed: 76 } as const
