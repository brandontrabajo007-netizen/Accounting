import type { Account } from '@domain/accounts/Account'
import { AccountType } from '@domain/accounts/AccountType'
import { validateAccount } from '@domain/accounts/validateAccount'
import type { CustomerPaymentAccountConfig } from './CustomerPaymentAccountConfig'

export const validateCustomerPaymentAccount = (mapping: CustomerPaymentAccountConfig, accountsCatalog: Account[]): void => {
  if (mapping.cashAccount) validateAccount('cashAccount', mapping.cashAccount, accountsCatalog, AccountType.ASSET)
  if (mapping.bankAccount) validateAccount('bankAccount', mapping.bankAccount, accountsCatalog, AccountType.ASSET)
  validateAccount('accountsReceivableAccount', mapping.accountsReceivableAccount, accountsCatalog, AccountType.ASSET)
}
