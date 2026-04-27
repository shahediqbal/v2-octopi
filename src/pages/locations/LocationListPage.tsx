import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertCircle, Loader2, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import { useDeleteLocation, usePaginatedLocations } from '@/hooks/useLocations'
import { useToastStore } from '@/stores/toastStore'

export function LocationListPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaginatedLocations(debouncedSearch)
  const deleteMutation = useDeleteLocation()
  const showToast = useToastStore((state) => state.showToast)

  const locations = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data])
  const totalRecords = data?.pages[0]?.totalRecords ?? 0

  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      })
      if (node) observerRef.current.observe(node)
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  )

  const handleDelete = (locationId: number) => {
    if (!window.confirm('Delete this location? This action cannot be undone.')) return
    deleteMutation.mutate(locationId, {
      onSuccess: (response) => {
        if (response.errMsg) {
          showToast({ message: response.errMsg, type: 'error' })
          return
        }
        showToast({ message: 'Location deleted successfully', type: 'success' })
      },
      onError: (deleteError) => {
        showToast({ message: (deleteError as Error)?.message || 'Failed to delete location', type: 'error' })
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalRecords > 0 ? `${totalRecords} total locations` : isLoading ? 'Loading…' : 'No locations'}
          </p>
        </div>

        <Link to="/locations/add" className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700">
          <Plus size={16} /> Add Location
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by location name…"
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">Loading locations…</span>
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load locations</p>
            <p className="mt-1 text-xs text-red-600">{(error as Error)?.message}</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Location Name</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {locations.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <MapPin size={24} className="text-gray-300" />
                        <span>{search ? 'No matching locations found.' : 'No locations yet.'}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  locations.map((location, index) => (
                    <tr
                      key={location.locationId}
                      ref={index === locations.length - 1 ? sentinelRef : undefined}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-5 py-3 text-gray-500">{location.locationId}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{location.locationName}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/locations/${location.locationId}/edit`}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <Pencil size={12} /> Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(location.locationId)}
                            disabled={deleteMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading more…</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}