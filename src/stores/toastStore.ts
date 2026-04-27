import { create } from 'zustand'

type ToastType = 'success' | 'error'

export interface AppToastState {
  message: string
  type: ToastType
}

interface ToastStore {
  toast: AppToastState | null
  showToast: (toast: AppToastState) => void
  clearToast: () => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
}))