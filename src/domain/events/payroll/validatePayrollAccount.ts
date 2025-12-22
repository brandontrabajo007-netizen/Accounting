// src/domain/events/payroll/validatePayrollAccount.ts
import type { Account } from '@domain/accounts/Account'
import type { PayrollAccountConfig } from './PayrollAccountConfig'
import type { PayrollEvent } from './PayrollEvent'

export const validatePayrollAccount = (config: PayrollAccountConfig, catalog: Account[], event: PayrollEvent): void => {
  const exists = (code?: number) => code && catalog.some((acc) => acc.code === code)

  if (config.expenseAccount && !exists(config.expenseAccount)) {
    throw new Error(`Payroll expense account ${config.expenseAccount} not found in catalog`)
  }

  if (event.paymentMethod === 'cash' && config.cashAccount && !exists(config.cashAccount)) {
    throw new Error(`Cash account ${config.cashAccount} not found in catalog`)
  }

  if (event.paymentMethod === 'bank' && config.bankAccount && !exists(config.bankAccount)) {
    throw new Error(`Bank account ${config.bankAccount} not found in catalog`)
  }
}
