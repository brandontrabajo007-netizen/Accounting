import type { BaseAccountMapping } from '../../accounts/BaseAccountMapping'

export interface SaleAccountConfig extends BaseAccountMapping {
  cashAccount: number // ej. 1105
  incomeAccount: number // ej. 4101
  vatAccount?: number // ej. 2408 (si aplica IVA)
  cogsAccount?: number // ej. 6135 (si aplica costo)
  inventoryAccount?: number // ej. 1435 (si aplica costo)
  accountsReceivableAccount?: number // ej. 1305 (ventas a credito)
}
