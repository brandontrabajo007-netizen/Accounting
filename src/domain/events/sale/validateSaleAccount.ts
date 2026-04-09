import type { Account } from '@domain/accounts/Account'
import { AccountType } from '@domain/accounts/AccountType'
import { validateAccount } from '@domain/accounts/validateAccount'
import type { SaleAccountConfig } from './SaleAccountConfig'
import type { SaleEvent } from './SaleEvent'

export const validateSaleAccount = (mapping: SaleAccountConfig, accountsCatalog: Account[], event?: SaleEvent): void => {
  const paymentMethod = event?.paymentMethod
    ? event.paymentMethod
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    : ''
  const isCredit = paymentMethod ? /(credito|a credito|al credito)/.test(paymentMethod) : false

  if (isCredit) {
    validateAccount('accountsReceivableAccount', mapping.accountsReceivableAccount, accountsCatalog, AccountType.ASSET)
  } else {
    validateAccount('cashAccount', mapping.cashAccount, accountsCatalog, AccountType.ASSET)
  }
  if (mapping.bankAccount) {
    validateAccount('bankAccount', mapping.bankAccount, accountsCatalog, AccountType.ASSET)
  }

  validateAccount('incomeAccount', mapping.incomeAccount, accountsCatalog, AccountType.INCOME)
  validateAccount('vatAccount', mapping.vatAccount, accountsCatalog, AccountType.LIABILITY)

  if (event?.includesCost) {
    if (mapping.cogsAccount) validateAccount('cogsAccount', mapping.cogsAccount, accountsCatalog, AccountType.EXPENSE)
    if (mapping.inventoryAccount) validateAccount('inventoryAccount', mapping.inventoryAccount, accountsCatalog, AccountType.ASSET)
  }
}
