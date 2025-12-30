import type { MovementStatus } from '@domain/movements/MovementStatus'

export type LedgerMovement = {
  id: string
  accountCode: number
  debit: number
  credit: number
  date: Date
  journalEntryId: string
  description: string
  companyId: string
  status: MovementStatus
  periodId?: string
  createdAt?: Date
}
