import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Generic column visibility store — keyed by a table ID so it can be
// reused for any table that needs persisted column show/hide.
interface ColumnVisibilityStore {
  visibility: Record<string, Record<string, boolean>>
  setColumn: (tableId: string, column: string, visible: boolean) => void
  toggleColumn: (tableId: string, column: string) => void
  getColumns: (tableId: string) => Record<string, boolean>
}

export const useColumnVisibilityStore = create<ColumnVisibilityStore>()(
  persist(
    (set, get) => ({
      visibility: {},

      setColumn: (tableId, column, visible) =>
        set((s) => ({
          visibility: {
            ...s.visibility,
            [tableId]: { ...s.visibility[tableId], [column]: visible },
          },
        })),

      toggleColumn: (tableId, column) => {
        const current = get().visibility[tableId]?.[column] ?? false
        set((s) => ({
          visibility: {
            ...s.visibility,
            [tableId]: { ...s.visibility[tableId], [column]: !current },
          },
        }))
      },

      getColumns: (tableId) => get().visibility[tableId] ?? {},
    }),
    { name: 'column-visibility-storage' },
  ),
)
