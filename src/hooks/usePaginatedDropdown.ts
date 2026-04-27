import { dropdownKeys } from '@/hooks/useDropdown'
import { PAGINATED_DROPDOWN_ENDPOINTS } from '@/config/pagination'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import type { DropdownOption, DropdownType } from '@/types/dropdown'

/**
 * Fetches paginated dropdown options with infinite scroll support.
 * Use for large datasets: customer, product, location, employee, supplier.
 * Handles both paginated and flat-array API response formats.
 */
export function usePaginatedDropdown(
  type: DropdownType,
  searchTerm = '',
  pageSize = 50
) {
  const endpointConfig = PAGINATED_DROPDOWN_ENDPOINTS[type]

  if (!endpointConfig) {
    throw new Error(`No paginated dropdown endpoint configured for type "${type}"`)
  }

  return usePaginatedList<DropdownOption>({
    queryKey: dropdownKeys.paginated(type, searchTerm, pageSize),
    endpointConfig,
    searchTerm,
    pageSize,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  })
}
