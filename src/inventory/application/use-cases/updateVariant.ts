import type { VariantRepo } from '../ports/VariantRepo'
import type { InventorySettingsRepo } from '../ports/InventorySettingsRepo'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { Sku } from '../../domain/value-objects/Sku'
import { VariantId } from '../../domain/value-objects/VariantId'
import type { VariantNotFound } from '../../domain/errors/VariantNotFound'
import type { InventoryModeViolation } from '../../domain/errors/InventoryModeViolation'
import type { Variant } from '../../domain/entities/Variant'
import { resolveInventoryMode } from '../services/resolveInventoryMode'

export type UpdateVariantCommand = Readonly<{
  companyId: string
  variantId: string
  attribute?: string
  value?: string
  active?: boolean
  skuVariant?: string | null
}>

export function makeUpdateVariant(deps: Readonly<{ variantRepo: VariantRepo; inventorySettingsRepo: InventorySettingsRepo }>) {
  return async function updateVariant(
    command: UpdateVariantCommand,
  ): Promise<ResultType<{ variant: Variant }, VariantNotFound | InventoryModeViolation>> {
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

    const updated: Variant = {
      ...variant,
      attribute: command.attribute ?? variant.attribute,
      value: command.value ?? variant.value,
      active: command.active ?? variant.active,
      skuVariant:
        command.skuVariant === null
          ? undefined
          : command.skuVariant
            ? Sku.from(command.skuVariant)
            : variant.skuVariant,
      updatedAt: new Date(),
    }

    await deps.variantRepo.update(updated)

    return Result.ok({ variant: updated })
  }
}
