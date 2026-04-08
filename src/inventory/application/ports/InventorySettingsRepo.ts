import type { InventoryMode, InventorySettings } from '../../domain/entities/InventorySettings'

export interface InventorySettingsRepo {
  getByCompanyId(companyId: string): Promise<InventorySettings | null>
  upsertMode(companyId: string, mode: InventoryMode): Promise<InventorySettings>
}
