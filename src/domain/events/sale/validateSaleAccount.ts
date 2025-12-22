import type { Account } from '@domain/accounts/Account'
import { AccountType } from '@domain/accounts/AccountType'
import { validateAccount } from '@domain/accounts/validateAccount'
import type { SaleAccountConfig } from './SaleAccountConfig'
import type { SaleEvent } from './SaleEvent'

export const validateSaleAccount = (mapping: SaleAccountConfig, accountsCatalog: Account[], event?: SaleEvent): void => {
  validateAccount('cashAccount', mapping.cashAccount, accountsCatalog, AccountType.ASSET)
  validateAccount('incomeAccount', mapping.incomeAccount, accountsCatalog, AccountType.INCOME)
  validateAccount('vatAccount', mapping.vatAccount, accountsCatalog, AccountType.LIABILITY)

  if (event?.includesCost) {
    if (mapping.cogsAccount) validateAccount('cogsAccount', mapping.cogsAccount, accountsCatalog, AccountType.EXPENSE)
    if (mapping.inventoryAccount) validateAccount('inventoryAccount', mapping.inventoryAccount, accountsCatalog, AccountType.ASSET)
  }
}
