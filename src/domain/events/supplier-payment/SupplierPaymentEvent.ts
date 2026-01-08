import type { AccountingEvent } from '../AccountingEvent'
import type { SupplierPaymentAccountConfig } from './SupplierPaymentAccountConfig'

export interface SupplierPaymentEvent extends AccountingEvent<SupplierPaymentAccountConfig> {
  companyId: string
  paymentMethod?: string | null
}
