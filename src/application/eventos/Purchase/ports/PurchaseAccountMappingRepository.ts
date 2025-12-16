import type { PurchaseAccountConfig } from '@domain/events/purchase/PurchaseAccountConfig'

export interface PurchaseAccountMappingRepository {
  getPurchaseAccountMappingByCompanyId(companyId: string): Promise<PurchaseAccountConfig>
}
