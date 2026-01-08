import type { AccountingEvent } from '../AccountingEvent'
import type { SaleAccountConfig } from './SaleAccountConfig'

export interface SaleEvent extends AccountingEvent<SaleAccountConfig> {
  totalAmount: number
  companyId: string
  includesVAT: boolean
  includesCost: boolean
  quantity?: number
  unitCost?: number
  unitPrice?: number
  paymentMethod?: string | null
}
