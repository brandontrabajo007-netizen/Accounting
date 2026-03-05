import type { ProductRepo } from '../ports/ProductRepo'
import type { VariantRepo } from '../ports/VariantRepo'
import type { MovementRepo } from '../ports/MovementRepo'
import type { IdGenerator } from '../types/IdGenerator'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { ProductId } from '../../domain/value-objects/ProductId'
import { VariantId } from '../../domain/value-objects/VariantId'
import type { ProductNotFound } from '../../domain/errors/ProductNotFound'
import type { VariantNotFound } from '../../domain/errors/VariantNotFound'
import type { InvalidQuantity } from '../../domain/errors/InvalidQuantity'
import type { InactiveProductOrVariant } from '../../domain/errors/InactiveProductOrVariant'
import type { InventoryMovement } from '../../domain/entities/InventoryMovement'

export type RegisterAdjustmentCommand = Readonly<{
  companyId: string
  reason: string
  items: ReadonlyArray<{
    productId: string
    variantId: string
    qtyDelta: number
  }>
}>

export function makeRegisterAdjustment(
  deps: Readonly<{ productRepo: ProductRepo; variantRepo: VariantRepo; movementRepo: MovementRepo; idGenerator: IdGenerator }>,
) {
  return async function registerAdjustment(
    command: RegisterAdjustmentCommand,
  ): Promise<
    ResultType<{ movementBatchId: string }, ProductNotFound | VariantNotFound | InvalidQuantity | InactiveProductOrVariant>
  > {
    const batchId = deps.idGenerator()
    const now = new Date()
    const movements: InventoryMovement[] = []

    for (const item of command.items) {
      if (item.qtyDelta === 0) {
        return Result.err({ type: 'InvalidQuantity', message: 'qtyDelta must be != 0' })
      }

      const product = await deps.productRepo.getById(command.companyId, ProductId.from(item.productId))
      if (!product) {
        return Result.err({ type: 'ProductNotFound', productId: item.productId })
      }
      if (!product.active) {
        return Result.err({ type: 'InactiveProductOrVariant', productId: item.productId })
      }

      const variant = await deps.variantRepo.getById(command.companyId, VariantId.from(item.variantId))
      if (!variant) {
        return Result.err({ type: 'VariantNotFound', variantId: item.variantId })
      }
      if (!variant.active) {
        return Result.err({ type: 'InactiveProductOrVariant', productId: item.productId, variantId: item.variantId })
      }

      movements.push({
        id: deps.idGenerator(),
        companyId: command.companyId,
        productId: ProductId.from(item.productId),
        variantId: VariantId.from(item.variantId),
        type: 'ADJUST',
        qtyDelta: item.qtyDelta,
        occurredAt: now,
        reference: { type: 'ADJUSTMENT', id: batchId },
        batchId,
        note: command.reason,
        createdAt: now,
      })
    }

    await deps.movementRepo.addMany(movements)

    return Result.ok({ movementBatchId: batchId })
  }
}
