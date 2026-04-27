import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_PINNED = 5

interface PinnedMenuState {
  pinnedIds: string[]
  pin: (id: string) => void
  unpin: (id: string) => void
  isPinned: (id: string) => boolean
  canPin: () => boolean
}

export const usePinnedMenuStore = create<PinnedMenuState>()(
  persist(
    (set, get) => ({
      pinnedIds: [],
      pin: (id) => {
        const { pinnedIds } = get()
        if (pinnedIds.length >= MAX_PINNED || pinnedIds.includes(id)) return
        set({ pinnedIds: [...pinnedIds, id] })
      },
      unpin: (id) => {
        set({ pinnedIds: get().pinnedIds.filter((p) => p !== id) })
      },
      isPinned: (id) => get().pinnedIds.includes(id),
      canPin: () => get().pinnedIds.length < MAX_PINNED,
    }),
    { name: 'pinned-menu-storage' },
  ),
)
