import { useDropdown } from '@/hooks/useDropdown'
import { DROPDOWN_REGISTRY } from '@/types/dropdown'
import type { DropdownType } from '@/types/dropdown'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface DropdownSelectProps {
  /** Which dropdown type to load (must be a Load All type) */
  type: DropdownType
  /** Currently selected key (number) */
  value?: number | null
  /** Called when the user selects an option */
  onValueChange: (value: number | null) => void
  /** Placeholder text shown when nothing is selected */
  placeholder?: string
  /** Disable the select */
  disabled?: boolean
  /** Show error styling */
  hasError?: boolean
  /** Additional CSS classes on the <select> element */
  className?: string
}

/**
 * Reusable dropdown select for "Load All" types (<=100 records).
 * Fetches data via the unified GetDropdown endpoint, caches aggressively.
 *
 * @example
 * // Standalone
 * <DropdownSelect type="supplier" value={supplierId} onValueChange={setSupplierId} />
 *
 * // With React Hook Form Controller
 * <Controller
 *   name="departmentId"
 *   control={form.control}
 *   render={({ field, fieldState }) => (
 *     <DropdownSelect
 *       type="department"
 *       value={field.value}
 *       onValueChange={field.onChange}
 *       hasError={!!fieldState.error}
 *     />
 *   )}
 * />
 */
export function DropdownSelect({
  type,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  hasError = false,
  className,
}: DropdownSelectProps) {
  const { data: options, isLoading, isError } = useDropdown(type)
  const config = DROPDOWN_REGISTRY[type]
  const placeholderText = placeholder ?? `Select ${config.label}...`

  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={(e) => {
          const val = e.target.value
          onValueChange(val === '' ? null : Number(val))
        }}
        disabled={disabled || isLoading}
        aria-label={config.label}
        className={cn(
          'w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-8 text-sm text-gray-900',
          'focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
          hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300',
          className
        )}
      >
        <option value="">{isLoading ? 'Loading...' : placeholderText}</option>
        {options?.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.value}
          </option>
        ))}
      </select>

      {/* Chevron icon */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : (
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </div>

      {isError && (
        <p className="mt-1 text-xs text-red-500">
          Failed to load {config.label.toLowerCase()} options
        </p>
      )}
    </div>
  )
}
