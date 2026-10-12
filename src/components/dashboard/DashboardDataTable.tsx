import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

export type DashboardSortValue = string | number | null | undefined

export interface DashboardTableColumn<T> {
  id: string
  header: string
  align?: 'left' | 'right' | 'center'
  widthClassName?: string
  sortable?: boolean
  sortValue?: (row: T) => DashboardSortValue
  render: (row: T, index: number) => ReactNode
}

interface DashboardDataTableProps<T> {
  rows: T[]
  columns: DashboardTableColumn<T>[]
  rowKey: (row: T, index: number) => string | number
  emptyMessage?: string
  minWidthClassName?: string
  defaultSort?: { columnId: string; direction: 'asc' | 'desc' }
  rowClassName?: (row: T) => string
  initialRowCount?: number
  expansionKey?: string | number
  collapsedLabel?: string
}

function compareValues(left: DashboardSortValue, right: DashboardSortValue) {
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

export function DashboardDataTable<T>({
  rows,
  columns,
  rowKey,
  emptyMessage = 'No data for the selected period.',
  minWidthClassName = 'min-w-[760px]',
  defaultSort,
  rowClassName,
  initialRowCount,
  expansionKey,
  collapsedLabel,
}: DashboardDataTableProps<T>) {
  const [sort, setSort] = useState(defaultSort)
  const [expansion, setExpansion] = useState({
    key: expansionKey,
    expanded: false,
  })
  const expanded = expansion.key === expansionKey && expansion.expanded

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const column = columns.find(item => item.id === sort.columnId)
    if (!column?.sortValue) return rows

    return rows
      .map((row, index) => ({ row, index }))
      .sort((left, right) => {
        const result = compareValues(column.sortValue?.(left.row), column.sortValue?.(right.row))
        return result === 0
          ? left.index - right.index
          : sort.direction === 'asc' ? result : -result
      })
      .map(item => item.row)
  }, [columns, rows, sort])
  const visibleRows = initialRowCount && !expanded
    ? sortedRows.slice(0, initialRowCount)
    : sortedRows

  const updateSort = (column: DashboardTableColumn<T>) => {
    if (column.sortable === false || !column.sortValue) return
    setSort(current => current?.columnId === column.id
      ? { columnId: column.id, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { columnId: column.id, direction: 'asc' })
  }

  return <div className="overflow-x-auto">
    <table className={`w-full text-sm ${minWidthClassName}`}>
      <thead>
        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 [&>th]:h-14 [&>th]:align-middle">
          {columns.map(column => {
            const active = sort?.columnId === column.id
            const sortable = column.sortable !== false && Boolean(column.sortValue)
            const alignment = column.align === 'right'
              ? 'justify-end text-right'
              : column.align === 'center' ? 'justify-center text-center' : 'justify-start text-left'

            return <th key={column.id} className={`px-2 font-semibold ${column.widthClassName ?? ''}`}>
              <button
                type="button"
                disabled={!sortable}
                onClick={() => updateSort(column)}
                className={`inline-flex w-full items-center gap-1.5 ${alignment} ${sortable ? 'cursor-pointer hover:text-slate-900' : 'cursor-default'}`}
                aria-label={sortable ? `Sort by ${column.header}` : undefined}
              >
                <span>{column.header}</span>
                {sortable && (active
                  ? sort?.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                  : <ArrowUpDown size={13} className="text-slate-300" />)}
              </button>
            </th>
          })}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {visibleRows.map((row, index) => <tr
          key={rowKey(row, index)}
          className={`transition-colors hover:bg-slate-50 ${rowClassName?.(row) ?? ''}`}
        >
          {columns.map(column => <td
            key={column.id}
            className={`px-2 py-3 align-middle ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}`}
          >
            {column.render(row, index)}
          </td>)}
        </tr>)}
      </tbody>
    </table>
    {!rows.length && <p className="py-10 text-center text-sm text-slate-400">{emptyMessage}</p>}
    {Boolean(initialRowCount && rows.length > initialRowCount) && <div className="flex justify-center border-t border-slate-100 py-3">
      <button
        type="button"
        onClick={() => setExpansion({ key: expansionKey, expanded: !expanded })}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
      >
        {expanded
          ? `Show first ${initialRowCount}`
          : collapsedLabel ?? `Show all (${rows.length})`}
      </button>
    </div>}
  </div>
}
