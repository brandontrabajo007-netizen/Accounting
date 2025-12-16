import type { Account } from '@domain/accounts/Account'
import type { PurchaseAccountConfig } from './PurchaseAccountConfig'
import type { PurchaseEvent } from './PurchaseEvent'

export const validatePurchaseAccount = (config: PurchaseAccountConfig, catalog: Account[], event: PurchaseEvent): void => {
  const exists = (code?: number) => code && catalog.some((acc) => acc.code === code)

  if (!exists(event.debitAccount)) {
    throw new Error(`Debit account ${event.debitAccount} not found`)
  }

  if (event.includesVAT && !exists(config.vatAccount)) {
    throw new Error(`VAT included but vatAccount is missing`)
  }

  if (event.paymentMethod === 'cash' && !exists(config.cashAccount)) {
    throw new Error('Cash payment requires cashAccount')
  }

  if (event.paymentMethod === 'bank' && !exists(config.bankAccount)) {
    throw new Error('Bank payment requires bankAccount')
  }

  if (event.paymentMethod === 'credit' && !exists(config.accountsPayableAccount)) {
    throw new Error('Credit payment requires accountsPayableAccount')
  }
}
