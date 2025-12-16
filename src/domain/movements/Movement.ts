import type { MovementStatus } from './MovementStatus'
import type { TransactionType } from './TransactionType'

export type MovementGroup = 'REVENUE' | 'COST' | 'MAIN'

export type Movement = {
  accountCode: number // e.g. 1105, 4101, 2408, 6135, 1435
  accountName: string
  type: TransactionType // debit or credit
  amount: number // always positive
  status: MovementStatus
  group: MovementGroup
}
