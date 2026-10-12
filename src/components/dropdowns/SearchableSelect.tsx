import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronsUpDown, Copy, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { copyTextToClipboard } from './dropdownUtils'

export interface SearchableSelectOption {
  key: number
  value: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: number | null
  onValueChange: (value: number | null) => void
  onLabelChange?: (label: string | null) => void
  placeholder?: string
  selectedLabel?: string | null
  ariaLabel: string
  disabled?: boolean
  hasError?: boolean
  className?: string
  emptyMessage?: string
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  onLabelChange,
  placeholder = 'Select an option...',
  selectedLabel,
  ariaLabel,
  disabled = false,
  hasError = false,
  className,
  emptyMessage = 'No results found',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedItemRef = useRef<HTMLDivElement | null>(null)
  const copyResetTimerRef = useRef<number | null>(null)

  const selectedOption = useMemo(
    () => options.find((option) => option.key === value) ?? null,
    [options, value],
  )
  const resolvedSelectedLabel = selectedOption?.value ?? selectedLabel ?? null
  const normalizedQuery = search.trim().toLowerCase()
  const filteredOptions = useMemo(
    () => options.filter((option) => option.value.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery, options],
  )

  function closeDropdown() {
    setOpen(false)
    setSearch('')
  }

  const updatePanelPosition = useCallback(() => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const viewportPadding = 8
    const maxWidth = Math.max(320, window.innerWidth - viewportPadding * 2)
    const width = Math.min(Math.max(rect.width, 360), maxWidth)
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

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const clickedInsideTrigger = containerRef.current?.contains(target)
      const clickedInsidePanel = panelRef.current?.contains(target)

      if (!clickedInsideTrigger && !clickedInsidePanel) {
        closeDropdown()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
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

  useEffect(() => {
    if (!open || value == null) return

    const frameId = window.requestAnimationFrame(() => {
      selectedItemRef.current?.scrollIntoView({ block: 'nearest' })
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [filteredOptions, open, value])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeDropdown()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current != null) {
        window.clearTimeout(copyResetTimerRef.current)
      }
    }
  }, [])

  function handleSelect(option: SearchableSelectOption) {
    onValueChange(option.key)
    onLabelChange?.(option.value)
    closeDropdown()
  }

  function handleClear(event: React.MouseEvent) {
    event.stopPropagation()
    selectedItemRef.current = null
    onValueChange(null)
    onLabelChange?.(null)
    setSearch('')
  }

  async function handleCopySelected(event: React.MouseEvent) {
    event.stopPropagation()
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
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          if (disabled) return
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
          className,
        )}
      >
        <span
          className={cn(
            'block min-w-0 flex-1 pr-2',
            resolvedSelectedLabel ? 'truncate text-gray-900' : 'text-gray-400',
          )}
        >
          {resolvedSelectedLabel ?? placeholder}
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
          <div className="flex items-center border-b border-gray-100 px-3">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={placeholder}
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

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">{emptyMessage}</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.key}
                  ref={(node) => {
                    if (option.key === value) {
                      selectedItemRef.current = node
                    }
                  }}
                  role="option"
                  aria-selected={option.key === value}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'flex cursor-pointer items-start px-3 py-2.5 text-sm',
                    'hover:bg-gray-50',
                    option.key === value && 'bg-gray-50 font-medium text-gray-900',
                  )}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      option.key === value ? 'text-gray-700' : 'text-transparent',
                    )}
                  />
                  <span className="min-w-0 whitespace-normal break-words leading-5">{option.value}</span>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}