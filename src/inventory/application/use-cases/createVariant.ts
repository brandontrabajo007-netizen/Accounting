import type { VariantRepo } from '../ports/VariantRepo'
import type { ProductRepo } from '../ports/ProductRepo'
import type { InventorySettingsRepo } from '../ports/InventorySettingsRepo'
import type { IdGenerator } from '../types/IdGenerator'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { ProductId } from '../../domain/value-objects/ProductId'
import { Sku } from '../../domain/value-objects/Sku'
import { VariantId } from '../../domain/value-objects/VariantId'
import type { ProductNotFound } from '../../domain/errors/ProductNotFound'
import type { InactiveProductOrVariant } from '../../domain/errors/InactiveProductOrVariant'
import type { InventoryModeViolation } from '../../domain/errors/InventoryModeViolation'
import type { Variant } from '../../domain/entities/Variant'
import { resolveInventoryMode } from '../services/resolveInventoryMode'

export type CreateVariantCommand = Readonly<{
  companyId: string
  productId: string
  attribute: string
  value: string
  skuVariant?: string
  active: boolean
}>

export function makeCreateVariant(
  deps: Readonly<{
    variantRepo: VariantRepo
    productRepo: ProductRepo
    inventorySettingsRepo: InventorySettingsRepo
    idGenerator: IdGenerator
  }>,
) {
  return async function createVariant(
    command: CreateVariantCommand,
  ): Promise<ResultType<{ variantId: VariantId }, ProductNotFound | InactiveProductOrVariant | InventoryModeViolation>> {
    const mode = await resolveInventoryMode(deps.inventorySettingsRepo, command.companyId)
    if (mode === 'SIMPLE') {
      return Result.err({
        type: 'InventoryModeViolation',
        mode,
        operation: 'VARIANT_MANAGEMENT',
      })
    }

    const product = await deps.productRepo.getById(command.companyId, ProductId.from(command.productId))
    if (!product) {
      return Result.err({ type: 'ProductNotFound', productId: command.productId })
    }
    if (!product.active) {
      return Result.err({ type: 'InactiveProductOrVariant', productId: command.productId })
    }

    const now = new Date()
    const variant: Variant = {
      id: VariantId.from(deps.idGenerator()),
      companyId: command.companyId,
      productId: product.id,
      attribute: command.attribute,
      value: command.value,
      skuVariant: command.skuVariant ? Sku.from(command.skuVariant) : undefined,
      active: command.active,
      createdAt: now,
      updatedAt: now,
    }

    await deps.variantRepo.create(variant)

    return Result.ok({ variantId: variant.id })
  }
}
