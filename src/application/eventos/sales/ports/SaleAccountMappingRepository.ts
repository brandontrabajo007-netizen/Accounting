// src/application/ports/SaleAccountMappingRepository.ts

import type { SaleAccountConfig } from '@domain/events/sale/SaleAccountConfig'

export interface SaleAccountMappingRepository {
  getSaleAccountMappingByCompanyId(companyId: string): Promise<SaleAccountConfig>
}
