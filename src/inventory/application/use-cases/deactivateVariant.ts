import type { VariantRepo } from '../ports/VariantRepo'
import type { InventorySettingsRepo } from '../ports/InventorySettingsRepo'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { VariantId } from '../../domain/value-objects/VariantId'
import type { VariantNotFound } from '../../domain/errors/VariantNotFound'
import type { InventoryModeViolation } from '../../domain/errors/InventoryModeViolation'
import { resolveInventoryMode } from '../services/resolveInventoryMode'

export type DeactivateVariantCommand = Readonly<{
  companyId: string
  variantId: string
}>

export function makeDeactivateVariant(
  deps: Readonly<{ variantRepo: VariantRepo; inventorySettingsRepo: InventorySettingsRepo }>,
) {
  return async function deactivateVariant(
    command: DeactivateVariantCommand,
  ): Promise<ResultType<{ ok: true }, VariantNotFound | InventoryModeViolation>> {
    const mode = await resolveInventoryMode(deps.inventorySettingsRepo, command.companyId)
    if (mode === 'SIMPLE') {
      return Result.err({
        type: 'InventoryModeViolation',
        mode,
        operation: 'VARIANT_MANAGEMENT',
      })
    }

    const variant = await deps.variantRepo.getById(command.companyId, VariantId.from(command.variantId))
    if (!variant) {
      return Result.err({ type: 'VariantNotFound', variantId: command.variantId })
    }

    await deps.variantRepo.deactivate(command.companyId, VariantId.from(command.variantId))

    return Result.ok({ ok: true })
  }
}
