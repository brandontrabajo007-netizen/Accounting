import type { PayrollAccountConfig } from '@domain/events/payroll/PayrollAccountConfig'
import type { PayrollAccountMappingMongo } from '../models/PayrollAccountMapping.model'

export const toPayrollAccountConfig = (doc: PayrollAccountMappingMongo): PayrollAccountConfig => ({
  companyId: doc.companyId,
  expenseAccount: doc.expenseAccount,
  cashAccount: doc.cashAccount,
  bankAccount: doc.bankAccount,
})
