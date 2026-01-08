import type { BaseAccountMapping } from '../../accounts/BaseAccountMapping'

export interface CustomerPaymentAccountConfig extends BaseAccountMapping {
  cashAccount?: number
  bankAccount?: number
  accountsReceivableAccount: number
}
