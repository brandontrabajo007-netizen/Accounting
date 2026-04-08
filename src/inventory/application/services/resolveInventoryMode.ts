import type { InventorySettingsRepo } from '../ports/InventorySettingsRepo'
import { DEFAULT_INVENTORY_MODE, type InventoryMode } from '../../domain/entities/InventorySettings'

export async function resolveInventoryMode(
  inventorySettingsRepo: InventorySettingsRepo,
  companyId: string,
): Promise<InventoryMode> {
  const settings = await inventorySettingsRepo.getByCompanyId(companyId)
  return settings?.mode ?? DEFAULT_INVENTORY_MODE
}
