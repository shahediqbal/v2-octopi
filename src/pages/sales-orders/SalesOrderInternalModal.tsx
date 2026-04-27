import { useRef } from 'react'
import { PrintDialog } from '@/pages/sales-orders/PrintDialog'
import { SalesOrderView } from '@/pages/sales-orders/SalesOrderView'
import { triggerPrintWindow } from '@/pages/sales-orders/printUtils'
import type { StockOutOrderDetail } from '@/types/stockOut'

interface SalesOrderInternalModalProps {
  isOpen: boolean
  detail: StockOutOrderDetail | null | undefined
  isLoading?: boolean
  errorMessage?: string
  title?: string
  onClose: () => void
}

export function SalesOrderInternalModal({
  isOpen,
  detail,
  isLoading = false,
  errorMessage,
  title = 'Sales Order Detail',
  onClose,
}: SalesOrderInternalModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    triggerPrintWindow(detail?.stockOutGeneralData.soSystemNo ?? 'sales-order', printRef.current)
  }

  return (
    <PrintDialog
      isOpen={isOpen}
      title={title}
      subtitle={detail?.stockOutGeneralData.soSystemNo ?? 'Stock-out invoice preview'}
      isLoading={isLoading}
      errorMessage={errorMessage}
      printDisabled={!detail}
      onClose={onClose}
      onPrint={handlePrint}
    >
      {detail && (
        <div ref={printRef} className="-mx-6 -my-6">
          <SalesOrderView detail={detail} />
        </div>
      )}
    </PrintDialog>
  )
}