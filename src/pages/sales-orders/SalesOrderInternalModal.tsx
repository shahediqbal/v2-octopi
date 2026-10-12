// import { useRef } from 'react'
// import { PrintDialog } from '@/pages/sales-orders/PrintDialog'
// import { SalesOrderView } from '@/pages/sales-orders/SalesOrderView'
// import { triggerPrintWindow } from '@/pages/sales-orders/printUtils'
// import type { StockOutOrderDetail } from '@/types/stockOut'

// interface SalesOrderInternalModalProps {
//   isOpen: boolean
//   detail: StockOutOrderDetail | null | undefined
//   isLoading?: boolean
//   errorMessage?: string
//   title?: string
//   viewVariant?: 'default' | 'packing-print'
//   showItemMetadata?: boolean
//   onClose: () => void
// }

// export function SalesOrderInternalModal({
//   isOpen,
//   detail,
//   isLoading = false,
//   errorMessage,
//   title = 'Sales Order Detail',
//   viewVariant = 'default',
//   showItemMetadata = false,
//   onClose,
// }: SalesOrderInternalModalProps) {
//   const printRef = useRef<HTMLDivElement>(null)

//   return (
//     <PrintDialog
//       isOpen={isOpen}
//       title={title}
//       subtitle={detail?.stockOutGeneralData.soSystemNo ?? 'Stock-out invoice preview'}
//       isLoading={isLoading}
//       errorMessage={errorMessage}
//       printDisabled={!detail}
//       onClose={onClose}
//       onPrint={() =>
//         triggerPrintWindow(detail?.stockOutGeneralData.soSystemNo ?? 'invoice', printRef.current)
//       }
//     >
//       {detail && (
//         <div ref={printRef} className="-mx-6 -my-6">
//           <SalesOrderView detail={detail} variant={viewVariant} showItemMetadata={showItemMetadata} />
//         </div>
//       )}
//     </PrintDialog>
//   )
// }

import { useRef, useState } from 'react'
import { PrintDialog } from '@/pages/sales-orders/PrintDialog'
import { SalesOrderView } from '@/pages/sales-orders/SalesOrderView'
import {
  downloadPreviewAsPdf,
  triggerPrintWindow,
} from '@/pages/sales-orders/printUtils'
import type { StockOutOrderDetail } from '@/types/stockOut'

interface SalesOrderInternalModalProps {
  isOpen: boolean
  detail: StockOutOrderDetail | null | undefined
  isLoading?: boolean
  errorMessage?: string
  title?: string
  viewVariant?: 'default' | 'packing-print'
  showItemMetadata?: boolean
  onClose: () => void
}

export function SalesOrderInternalModal({
  isOpen,
  detail,
  isLoading = false,
  errorMessage,
  title = 'Sales Order Detail',
  viewVariant = 'default',
  showItemMetadata = false,
  onClose,
}: SalesOrderInternalModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const documentTitle =
    detail?.stockOutGeneralData.soSystemNo ?? 'invoice'

  async function handleDownloadPdf() {
    if (!detail || isGeneratingPdf) return

    setIsGeneratingPdf(true)

    try {
      await downloadPreviewAsPdf(
        `${documentTitle}_Invoice`,
        printRef.current,
      )
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <PrintDialog
      isOpen={isOpen}
      title={title}
      subtitle={
        detail?.stockOutGeneralData.soSystemNo ??
        'Stock-out invoice preview'
      }
      isLoading={isLoading}
      errorMessage={errorMessage}
      printDisabled={!detail}
      printLabel="Print"
      secondaryActionLabel={
        isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'
      }
      secondaryActionDisabled={!detail || isGeneratingPdf}
      onClose={onClose}
      onSecondaryAction={() => {
        void handleDownloadPdf()
      }}
      onPrint={() =>
        triggerPrintWindow(documentTitle, printRef.current)
      }
    >
      {detail && (
        <div ref={printRef} className="-mx-6 -my-6">
          <SalesOrderView
            detail={detail}
            variant={viewVariant}
            showItemMetadata={showItemMetadata}
          />
        </div>
      )}
    </PrintDialog>
  )
}