export type CustomerHistoryType = 'sale' | 'payment'

export interface CustomerHistoryEntry {
  id: string
  companyId: string
  customerId: string
  type: CustomerHistoryType
  amount: number
  date: Date
  description?: string
  paymentMethod?: string
  journalEntryId?: string
  createdAt: Date
}
