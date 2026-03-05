import type { SaleItem } from '../types/SaleItem'
import type { ReverseResponse } from '../types/ReverseResponse'

export interface InventoryReversePort {
  reverseSalidaInventario(
    input: Readonly<{ companyId: string; saleId: string; items: ReadonlyArray<SaleItem>; reason: string }>,
  ): Promise<ReverseResponse>
}
