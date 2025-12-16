// src/infra/persistence/mongo/mappers/saleAccountMapping.mapper.ts

import type { SaleAccountConfig } from '@domain/events/sale/SaleAccountConfig'
import type { SaleAccountMappingDocument } from '../models/saleAccountMapping.model'

export const mongoToSaleAccountConfig = (doc: SaleAccountMappingDocument): SaleAccountConfig => ({
  companyId: doc.companyId,
  cashAccount: doc.cashAccount,
  incomeAccount: doc.incomeAccount,
  vatAccount: doc.vatAccount ?? undefined,
  cogsAccount: doc.cogsAccount ?? undefined,
  inventoryAccount: doc.inventoryAccount ?? undefined,
})
