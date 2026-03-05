import type { SaleItem } from '../types/SaleItem'
import type { ConfirmResponse } from '../types/ConfirmResponse'

export interface InventoryConfirmPort {
  confirmarSalidaInventario(
    input: Readonly<{ companyId: string; saleId: string; items: ReadonlyArray<SaleItem>; reference: string }>,
  ): Promise<ConfirmResponse>
}
