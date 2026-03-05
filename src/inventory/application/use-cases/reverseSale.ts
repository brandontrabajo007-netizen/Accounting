import type { MovementRepo } from '../ports/MovementRepo'
import type { ProductRepo } from '../ports/ProductRepo'
import type { VariantRepo } from '../ports/VariantRepo'
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

export type ReverseSaleCommand = Readonly<{
  companyId: string
  saleId: string
  items: ReadonlyArray<{ productId: string; variantId: string; qty: number }>
  reason: string
}>

export type ReverseSaleResult = Readonly<{
  ok: true
  movementBatchId: string
}>

export function makeReverseSale(
  deps: Readonly<{ productRepo: ProductRepo; variantRepo: VariantRepo; movementRepo: MovementRepo; idGenerator: IdGenerator }>,
) {
  return async function reverseSale(
    command: ReverseSaleCommand,
  ): Promise<
    ResultType<ReverseSaleResult, ProductNotFound | VariantNotFound | InvalidQuantity | InactiveProductOrVariant>
  > {
    const existing = await deps.movementRepo.findByReference(command.companyId, 'REVERSAL', command.saleId)
    if (existing.length > 0) {
      return Result.ok({ ok: true, movementBatchId: existing[0]?.batchId ?? command.saleId })
    }

    const now = new Date()
    const movements: InventoryMovement[] = []

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
        type: 'IN',
        qty: Quantity.from(item.qty),
        occurredAt: now,
        reference: { type: 'REVERSAL', id: command.saleId },
        batchId: command.saleId,
        note: command.reason,
        createdAt: now,
      })
    }

    await deps.movementRepo.addMany(movements)

    return Result.ok({ ok: true, movementBatchId: command.saleId })
  }
}
