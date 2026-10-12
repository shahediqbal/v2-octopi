import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { usePaginatedDropdown } from '@/hooks/usePaginatedDropdown'
import { useDebounce } from '@/hooks/useDebounce'
import { DROPDOWN_REGISTRY } from '@/types/dropdown'
import type { DropdownType } from '@/types/dropdown'
import { cn } from '@/lib/utils'
import { AlertCircle, Check, ChevronsUpDown, Copy, Loader2, RefreshCw, Search, X } from 'lucide-react'
import { copyTextToClipboard } from './dropdownUtils'

interface PaginatedComboboxProps {
  /** Which dropdown type to load (customer, product, location, employee) */
  type: DropdownType
  /** Currently selected key */
  value?: number | null
  /** Called when the user selects or clears an option */
  onValueChange: (value: number | null) => void
  /** Optional: called with the label of the selected option (or null on clear) */
  onLabelChange?: (label: string | null) => void
  /** Placeholder text */
  placeholder?: string
  /** Fallback label for preloaded values not yet present in the fetched page */
  selectedLabel?: string | null
  /** Disable the combobox */
  disabled?: boolean
  /** Show error styling */
  hasError?: boolean
  /** Additional CSS classes on the trigger button */
  className?: string
}

/**
 * Searchable combobox with infinite scroll for paginated dropdown types.
 * Use for large or growing datasets such as customer, product, location, employee, and supplier.
 *
 * @example
 * // Standalone
 * <PaginatedCombobox type="customer" value={customerId} onValueChange={setCustomerId} />
 *
 * // With React Hook Form Controller
 * <Controller
 *   name="customerId"
 *   control={form.control}
 *   render={({ field, fieldState }) => (
 *     <PaginatedCombobox
 *       type="customer"
 *       value={field.value}
 *       onValueChange={field.onChange}
 *       hasError={!!fieldState.error}
 *     />
 *   )}
 * />
 */
export function PaginatedCombobox({
  type,
  value,
  onValueChange,
  onLabelChange,
  placeholder,
  selectedLabel,
  disabled = false,
  hasError = false,
  className,
}: PaginatedComboboxProps) {
  const config = DROPDOWN_REGISTRY[type]
  const placeholderText = placeholder ?? `Search ${config.label}...`

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedOption, setSelectedOption] = useState<{ key: number; value: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const selectedItemRef = useRef<HTMLDivElement | null>(null)
  const copyResetTimerRef = useRef<number | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    usePaginatedDropdown(type, debouncedSearch, config.pageSize ?? 50)

  const options = useMemo(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data],
  )
  const resolvedSelectedLabel =
    value == null
      ? (selectedLabel ?? null)
      : options.find((option) => option.key === value)?.value
        ?? selectedLabel
        ?? (selectedOption?.key === value ? selectedOption.value : null)

  function closeDropdown() {
    setOpen(false)
    setSearch('')
  }

  const updatePanelPosition = useCallback(() => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const viewportPadding = 8
    const maxWidth = Math.max(320, window.innerWidth - viewportPadding * 2)
    const width = Math.min(Math.max(rect.width, 420), maxWidth)
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      window.innerWidth - width - viewportPadding,
    )

    setPanelPosition({
      top: rect.bottom + 4,
      left,
      width,
    })
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      const clickedInsideTrigger = containerRef.current?.contains(target)
      const clickedInsidePanel = panelRef.current?.contains(target)

      if (!clickedInsideTrigger && !clickedInsidePanel) {
        closeDropdown()
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return

    updatePanelPosition()
    window.addEventListener('resize', updatePanelPosition)
    window.addEventListener('scroll', updatePanelPosition, true)

    return () => {
      window.removeEventListener('resize', updatePanelPosition)
      window.removeEventListener('scroll', updatePanelPosition, true)
    }
  }, [open, updatePanelPosition])

  // Scroll the active option into view when reopening the list.
  useEffect(() => {
    if (!open || value == null) return
    const frameId = window.requestAnimationFrame(() => {
      selectedItemRef.current?.scrollIntoView({ block: 'nearest' })
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [open, options, value])

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current != null) {
        window.clearTimeout(copyResetTimerRef.current)
      }
    }
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDropdown()
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  // Infinite scroll: observe last item
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      })
      if (node) observerRef.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  )

  function handleSelect(key: number) {
    const matchedOption = options.find((option) => option.key === key) ?? null
    const nextValue = key === value ? null : key

    setSelectedOption(nextValue == null ? null : matchedOption)
    onLabelChange?.(nextValue == null ? null : matchedOption?.value ?? null)
    onValueChange(nextValue)
    closeDropdown()
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    selectedItemRef.current = null
    onValueChange(null)
    onLabelChange?.(null)
    setSearch('')
  }

  async function handleCopySelected(e: React.MouseEvent) {
    e.stopPropagation()
    if (!resolvedSelectedLabel) return

    const wasCopied = await copyTextToClipboard(resolvedSelectedLabel)
    if (!wasCopied) return

    setCopied(true)
    if (copyResetTimerRef.current != null) {
      window.clearTimeout(copyResetTimerRef.current)
    }
    copyResetTimerRef.current = window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-label={config.label}
        disabled={disabled}
        onClick={() => {
          if (open) {
            closeDropdown()
            return
          }
          updatePanelPosition()
          setOpen(true)
        }}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-left text-sm',
          'focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
          hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300',
          className
        )}
      >
        <span
          className={cn(
            'block min-w-0 flex-1 pr-2',
            resolvedSelectedLabel ? 'truncate text-gray-900' : 'text-gray-400',
          )}
        >
          {resolvedSelectedLabel ?? placeholderText}
        </span>
        <div className="flex items-center gap-1">
          {resolvedSelectedLabel && (
            <span
              role="button"
              tabIndex={0}
              title={copied ? 'Copied' : 'Copy selected option'}
              onClick={handleCopySelected}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  void handleCopySelected(event as unknown as React.MouseEvent)
                }
              }}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <Copy className={cn('h-3.5 w-3.5', copied && 'text-emerald-600')} />
            </span>
          )}
          {value != null && !disabled && (
            <X
              className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
        </div>
      </button>

      {/* Dropdown panel */}
      {open && panelPosition && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[100] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
          style={{
            top: panelPosition.top,
            left: panelPosition.left,
            width: panelPosition.width,
          }}
        >
          {/* Search input */}
          <div className="flex items-center border-b border-gray-100 px-3">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholderText}
              className="w-full border-0 bg-transparent px-2 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div ref={listRef} className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center gap-2 py-6">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-sm text-red-500">Failed to load {config.label.toLowerCase()} list</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            ) : options.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">
                No results found
              </div>
            ) : (
              options.map((opt, index) => (
                <div
                  key={opt.key}
                  ref={(node) => {
                    if (opt.key === value) {
                      selectedItemRef.current = node
                    }
                    if (index === options.length - 1) {
                      lastItemRef(node)
                    }
                  }}
                  role="option"
                  aria-selected={opt.key === value}
                  onClick={() => handleSelect(opt.key)}
                  className={cn(
                    'flex cursor-pointer items-start px-3 py-2.5 text-sm',
                    'hover:bg-gray-50',
                    opt.key === value && 'bg-gray-50 font-medium text-gray-900'
                  )}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      opt.key === value ? 'text-gray-700' : 'text-transparent'
                    )}
                  />
                  <span className="min-w-0 whitespace-normal break-words leading-5">{opt.value}</span>
                </div>
              ))
            )}

            {isFetchingNextPage && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {/* Total count footer */}
          {data?.pages[0] && (
            <div className="border-t border-gray-100 px-3 py-1.5 text-xs text-gray-400">
              {data.pages[0].totalRecords} total records
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
