import type { CustomerPaymentAccountConfig } from '@domain/events/customer-payment/CustomerPaymentAccountConfig'
import type { CustomerPaymentAccountMappingDocument } from '../models/customerPaymentAccountMapping.model'

export const mongoToCustomerPaymentAccountConfig = (doc: CustomerPaymentAccountMappingDocument): CustomerPaymentAccountConfig => ({
  companyId: doc.companyId,
  cashAccount: doc.cashAccount ?? undefined,
  bankAccount: doc.bankAccount ?? undefined,
  accountsReceivableAccount: doc.accountsReceivableAccount,
})
