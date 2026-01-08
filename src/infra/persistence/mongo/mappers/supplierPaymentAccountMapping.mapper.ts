import type { SupplierPaymentAccountConfig } from '@domain/events/supplier-payment/SupplierPaymentAccountConfig'
import type { SupplierPaymentAccountMappingDocument } from '../models/supplierPaymentAccountMapping.model'

export const mongoToSupplierPaymentAccountConfig = (doc: SupplierPaymentAccountMappingDocument): SupplierPaymentAccountConfig => ({
  companyId: doc.companyId,
  cashAccount: doc.cashAccount ?? undefined,
  bankAccount: doc.bankAccount ?? undefined,
  accountsPayableAccount: doc.accountsPayableAccount,
})
