import type { ProductRepo } from '../ports/ProductRepo'
import type { VariantRepo } from '../ports/VariantRepo'
import type { MovementRepo } from '../ports/MovementRepo'
import type { InventorySettingsRepo } from '../ports/InventorySettingsRepo'
import type { IdGenerator } from '../types/IdGenerator'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { ProductId } from '../../domain/value-objects/ProductId'
import { Quantity } from '../../domain/value-objects/Quantity'
import { VariantId } from '../../domain/value-objects/VariantId'
import type { ProductNotFound } from '../../domain/errors/ProductNotFound'
import type { VariantNotFound } from '../../domain/errors/VariantNotFound'
import type { InvalidQuantity } from '../../domain/errors/InvalidQuantity'
import type { InactiveProductOrVariant } from '../../domain/errors/InactiveProductOrVariant'
import type { InventoryMovement } from '../../domain/entities/InventoryMovement'
import { resolveInventoryMode } from '../services/resolveInventoryMode'
import { ensureSimpleDefaultVariant } from '../services/ensureSimpleDefaultVariant'

export type RegisterReceiptCommand = Readonly<{
  companyId: string
  referenceType: 'PURCHASE' | 'MANUAL'
  referenceId?: string
  items: ReadonlyArray<{
    productId: string
    variantId?: string
    variant?: Readonly<{ attribute: string; value: string }>
    qty: number
    unitCost?: number
  }>
}>

export function makeRegisterReceipt(
  deps: Readonly<{
    productRepo: ProductRepo
    variantRepo: VariantRepo
    movementRepo: MovementRepo
    inventorySettingsRepo: InventorySettingsRepo
    idGenerator: IdGenerator
  }>,
) {
  return async function registerReceipt(
    command: RegisterReceiptCommand,
  ): Promise<
    ResultType<{ movementBatchId: string }, ProductNotFound | VariantNotFound | InvalidQuantity | InactiveProductOrVariant>
  > {
    const batchId = deps.idGenerator()
    const now = new Date()
    const movements: InventoryMovement[] = []
    const mode = await resolveInventoryMode(deps.inventorySettingsRepo, command.companyId)
    const aggregated = new Map<string, { productId: string; variantId: string; qty: number }>()

    for (const item of command.items) {
      if (item.qty <= 0) {
        return Result.err({ type: 'InvalidQuantity', message: 'qty must be > 0' })
      }

      const product = await deps.productRepo.getById(command.companyId, ProductId.from(item.productId))
      if (!product) {
        return Result.err({ type: 'ProductNotFound', productId: item.productId })
      }
      if (!product.active) {
        return Result.err({ type: 'InactiveProductOrVariant', productId: item.productId })
      }

      const variant =
        mode === 'SIMPLE'
          ? await ensureSimpleDefaultVariant(deps, { companyId: command.companyId, product })
          : item.variantId
            ? await deps.variantRepo.getById(command.companyId, VariantId.from(item.variantId))
            : item.variant
              ? await deps.variantRepo.getByProductAndAttributeValue(
                  command.companyId,
                  ProductId.from(item.productId),
                  item.variant.attribute,
                  item.variant.value,
                )
              : null
      if (!variant) {
        return Result.err({ type: 'VariantNotFound', variantId: item.variantId ?? item.variant?.value ?? '' })
      }
      if (!variant.active) {
        return Result.err({ type: 'InactiveProductOrVariant', productId: item.productId, variantId: variant.id })
      }

      const key = `${item.productId}|${variant.id}`
      const current = aggregated.get(key)
      if (current) {
        current.qty += item.qty
      } else {
        aggregated.set(key, {
          productId: item.productId,
          variantId: variant.id,
          qty: item.qty,
        })
      }
    }

    for (const entry of aggregated.values()) {
      movements.push({
        id: deps.idGenerator(),
        companyId: command.companyId,
        productId: ProductId.from(entry.productId),
        variantId: VariantId.from(entry.variantId),
        type: 'IN',
        qty: Quantity.from(entry.qty),
        occurredAt: now,
        reference: { type: command.referenceType, id: command.referenceId ?? batchId },
        batchId,
        createdAt: now,
      })
    }

    await deps.movementRepo.addMany(movements)

    return Result.ok({ movementBatchId: batchId })
  }
}
