import type { VariantRepo } from '../ports/VariantRepo'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { Sku } from '../../domain/value-objects/Sku'
import { VariantId } from '../../domain/value-objects/VariantId'
import type { VariantNotFound } from '../../domain/errors/VariantNotFound'
import type { Variant } from '../../domain/entities/Variant'

export type UpdateVariantCommand = Readonly<{
  companyId: string
  variantId: string
  attribute?: string
  value?: string
  active?: boolean
  skuVariant?: string | null
}>

export function makeUpdateVariant(deps: Readonly<{ variantRepo: VariantRepo }>) {
  return async function updateVariant(
    command: UpdateVariantCommand,
  ): Promise<ResultType<{ variant: Variant }, VariantNotFound>> {
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
