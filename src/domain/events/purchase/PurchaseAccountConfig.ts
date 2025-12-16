import type { BaseAccountMapping } from '../../accounts/BaseAccountMapping'

export interface PurchaseAccountConfig extends BaseAccountMapping {
  vatAccount?: number // 2408 IVA descontable
  cashAccount?: number // 1105 Caja
  bankAccount?: number // 1110 Bancos
  accountsPayableAccount: number // 2205 Proveedores
}
