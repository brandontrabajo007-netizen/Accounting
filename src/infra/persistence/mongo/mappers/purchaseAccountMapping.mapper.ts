import type { PurchaseAccountConfig } from '@domain/events/purchase/PurchaseAccountConfig'
import type { PurchaseAccountMappingDocument } from '../models/PurchaseAccountMapping.model'

export const toPurchaseAccountConfig = (doc: PurchaseAccountMappingDocument): PurchaseAccountConfig => ({
  companyId: doc.companyId,
  vatAccount: doc.vatAccount ?? undefined,
  cashAccount: doc.cashAccount ?? undefined,
  bankAccount: doc.bankAccount ?? undefined,
  accountsPayableAccount: doc.accountsPayableAccount,
})

// Si en algún momento quieres guardar desde dominio → Mongo
export const toPurchaseAccountMappingDocument = (config: PurchaseAccountConfig) => ({
  companyId: config.companyId,
  vatAccount: config.vatAccount,
  cashAccount: config.cashAccount,
  bankAccount: config.bankAccount,
  accountsPayableAccount: config.accountsPayableAccount,
})
