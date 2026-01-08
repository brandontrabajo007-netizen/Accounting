import type { CustomerPaymentAccountConfig } from '@domain/events/customer-payment/CustomerPaymentAccountConfig'

export interface CustomerPaymentAccountMappingRepository {
  getCustomerPaymentAccountMappingByCompanyId(companyId: string): Promise<CustomerPaymentAccountConfig>
  save(mapping: CustomerPaymentAccountConfig): Promise<void>
}
