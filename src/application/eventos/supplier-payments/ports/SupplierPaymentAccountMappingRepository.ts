import type { SupplierPaymentAccountConfig } from '@domain/events/supplier-payment/SupplierPaymentAccountConfig'

export interface SupplierPaymentAccountMappingRepository {
  getSupplierPaymentAccountMappingByCompanyId(companyId: string): Promise<SupplierPaymentAccountConfig>
}
