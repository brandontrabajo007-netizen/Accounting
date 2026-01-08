export type ArEntryType = 'debit' | 'credit'

export interface ArEntrySource {
  kind: 'sale' | 'payment' | 'manual'
  referenceId?: string
  note?: string
}

export interface ArEntry {
  id: string
  companyId: string
  customerId: string
  type: ArEntryType
  amount: number
  date: Date
  source: ArEntrySource
  createdAt: Date
}
