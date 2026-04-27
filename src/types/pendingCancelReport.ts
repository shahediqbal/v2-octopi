/* ─── Pending & Cancel Report types ─── */

export interface PendingCancelReportItem {
  customerName: string | null
  soSystemNo: string | null
  soSystemId: number | null
  invoiceDate: string | null
  soSystemPending: string | null
  soDecesionPending: string | null
  daysPending: number | null
  channelName: string | null
  lastAssignedFirstName: string | null
  lastAssignedLastName: string | null
}
