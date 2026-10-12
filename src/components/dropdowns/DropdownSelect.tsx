import { useDropdown } from '@/hooks/useDropdown'
import { DROPDOWN_REGISTRY } from '@/types/dropdown'
import type { DropdownType } from '@/types/dropdown'
import { SearchableSelect } from './SearchableSelect'

interface DropdownSelectProps {
  /** Which dropdown type to load (must be a Load All type) */
  type: DropdownType
  /** Currently selected key (number) */
  value?: number | null
  /** Called when the user selects an option */
  onValueChange: (value: number | null) => void
  /** Optional: called with the label of the selected option (or null on clear) */
  onLabelChange?: (label: string | null) => void
  /** Fallback label for preloaded values not yet present in the fetched list */
  selectedLabel?: string | null
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
  onLabelChange,
  selectedLabel,
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
      <SearchableSelect
        options={options ?? []}
        value={value}
        onValueChange={onValueChange}
        onLabelChange={onLabelChange}
        placeholder={isLoading ? 'Loading...' : placeholderText}
        selectedLabel={selectedLabel}
        ariaLabel={config.label}
        disabled={disabled || isLoading}
        hasError={hasError}
        className={className}
        emptyMessage={`No ${config.label.toLowerCase()} options found`}
      />

      {isError && (
        <p className="mt-1 text-xs text-red-500">
          Failed to load {config.label.toLowerCase()} options
        </p>
      )}
    </div>
  )
}
