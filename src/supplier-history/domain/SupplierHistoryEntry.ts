export type SupplierHistoryType = 'purchase' | 'payment'

export interface SupplierHistoryEntry {
  id: string
  companyId: string
  supplierId: string
  type: SupplierHistoryType
  amount: number
  date: Date
  description?: string
  paymentMethod?: string
  journalEntryId?: string
  createdAt: Date
}
