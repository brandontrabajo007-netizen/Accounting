import type { VariantRepo } from '../ports/VariantRepo'
import type { MovementRepo } from '../ports/MovementRepo'
import type { InventorySettingsRepo } from '../ports/InventorySettingsRepo'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { VariantId } from '../../domain/value-objects/VariantId'
import type { VariantNotFound, VariantHasMovements } from '../../domain/errors/VariantNotFound'
import type { InventoryModeViolation } from '../../domain/errors/InventoryModeViolation'
import { resolveInventoryMode } from '../services/resolveInventoryMode'

export type DeleteVariantCommand = Readonly<{
  companyId: string
  variantId: string
}>

export function makeDeleteVariant(
  deps: Readonly<{ variantRepo: VariantRepo; movementRepo: MovementRepo; inventorySettingsRepo: InventorySettingsRepo }>,
) {
  return async function deleteVariant(
    command: DeleteVariantCommand,
  ): Promise<ResultType<{ ok: true }, VariantNotFound | VariantHasMovements | InventoryModeViolation>> {
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

    const hasMovements = await deps.movementRepo.existsByVariant(command.companyId, VariantId.from(command.variantId))
    if (hasMovements) {
      return Result.err({ type: 'VariantHasMovements', variantId: command.variantId })
    }

    await deps.variantRepo.delete(command.companyId, VariantId.from(command.variantId))

    return Result.ok({ ok: true })
  }
}
