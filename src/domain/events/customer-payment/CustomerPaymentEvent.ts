import type { AccountingEvent } from '../AccountingEvent'
import type { CustomerPaymentAccountConfig } from './CustomerPaymentAccountConfig'

export interface CustomerPaymentEvent extends AccountingEvent<CustomerPaymentAccountConfig> {
  companyId: string
  paymentMethod?: string | null
}
