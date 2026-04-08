import type { InventorySettingsRepo } from '../ports/InventorySettingsRepo'
import type { InventoryMode } from '../../domain/entities/InventorySettings'
import { resolveInventoryMode } from '../services/resolveInventoryMode'

export type GetInventorySettingsCommand = Readonly<{
  companyId: string
}>

export type GetInventorySettingsResult = Readonly<{
  mode: InventoryMode
}>

export function makeGetInventorySettings(deps: Readonly<{ inventorySettingsRepo: InventorySettingsRepo }>) {
  return async function getInventorySettings(command: GetInventorySettingsCommand): Promise<GetInventorySettingsResult> {
    const mode = await resolveInventoryMode(deps.inventorySettingsRepo, command.companyId)
    return { mode }
  }
}
