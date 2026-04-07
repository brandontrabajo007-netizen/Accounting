import type { LedgerMovement } from '@domain/ledger/LedgerMovement'

export type LedgerMovementFilters = {
  companyId: string
  accountCode: number
  periodId?: string
  from?: Date
  to?: Date
}

export type LedgerMovementList = {
  items: LedgerMovement[]
  total: number
  totals: {
    debit: number
    credit: number
  }
}

export interface LedgerMovementRepository {
  findByAccount(params: LedgerMovementFilters & { page: number; limit: number }): Promise<LedgerMovementList>
  sumBefore(params: LedgerMovementFilters & { before: Date }): Promise<{ debit: number; credit: number }>
  sumBeforeCursor(
    params: LedgerMovementFilters & {
      cursor: {
        date: Date
        createdAt: Date
        id: string
      }
    },
  ): Promise<{ debit: number; credit: number }>
}
