export type ApEntryType = 'debit' | 'credit'

export interface ApEntrySource {
  kind: 'purchase' | 'payment' | 'manual'
  referenceId?: string
  note?: string
}

export interface ApEntry {
  id: string
  companyId: string
  supplierId: string
  type: ApEntryType
  amount: number
  date: Date
  source: ApEntrySource
  createdAt: Date
}
