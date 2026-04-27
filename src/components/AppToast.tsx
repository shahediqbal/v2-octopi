import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/stores/toastStore'

export function AppToast() {
  const toast = useToastStore((state) => state.toast)
  const clearToast = useToastStore((state) => state.clearToast)

  useEffect(() => {
    if (!toast) return
    const timeoutId = window.setTimeout(() => clearToast(), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [clearToast, toast])

  if (!toast) return null

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg',
        toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white',
      )}
    >
      {toast.message}
      <button type="button" onClick={clearToast} className="ml-1 opacity-70 transition-opacity hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  )
}