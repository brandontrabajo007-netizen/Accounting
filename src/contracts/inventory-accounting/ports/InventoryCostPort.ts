import type { SaleItem } from '../types/SaleItem'
import type { CostResponse } from '../types/CostResponse'

export interface InventoryCostPort {
  getCostoVenta(
    input: Readonly<{ companyId: string; saleId: string; items: ReadonlyArray<SaleItem> }>,
  ): Promise<CostResponse>
}
