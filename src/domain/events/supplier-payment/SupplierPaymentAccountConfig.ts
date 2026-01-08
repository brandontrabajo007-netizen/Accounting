import type { BaseAccountMapping } from '../../accounts/BaseAccountMapping'

export interface SupplierPaymentAccountConfig extends BaseAccountMapping {
  cashAccount?: number
  bankAccount?: number
  accountsPayableAccount: number
}
