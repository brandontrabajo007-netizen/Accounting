import type { TransactionType } from '@domain/movements'
import type { AccountType } from './AccountType'

export type Account = {
  code: number // 1105, 4101, etc.
  name: string // Caja general
  type: AccountType // asset | liability | income | expense...
  nature: TransactionType // Naturaleza contable del PUC
  currentBalanceByCompany: Record<string, number>
}
