import type { AccountingEvent } from '../AccountingEvent'
import type { PurchaseAccountConfig } from './PurchaseAccountConfig'

export interface PurchaseEvent extends AccountingEvent<PurchaseAccountConfig> {
  companyId: string
  description: string
  amount: number
  includesVAT: boolean
  debitAccount: number // cuenta del debe elegida por el usuario
  paymentMethod: 'cash' | 'bank' | 'credit'
  date: Date
  supplier?: string
}
