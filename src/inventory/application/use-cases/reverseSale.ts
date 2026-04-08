import type { MovementRepo } from '../ports/MovementRepo'
import type { ProductRepo } from '../ports/ProductRepo'
import type { VariantRepo } from '../ports/VariantRepo'
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

export type ReverseSaleCommand = Readonly<{
  companyId: string
  saleId: string
  items: ReadonlyArray<{ productId: string; variantId?: string; qty: number }>
  reason: string
}>

export type ReverseSaleResult = Readonly<{
  ok: true
  movementBatchId: string
}>

export function makeReverseSale(
  deps: Readonly<{
    productRepo: ProductRepo
    variantRepo: VariantRepo
    movementRepo: MovementRepo
    inventorySettingsRepo: InventorySettingsRepo
    idGenerator: IdGenerator
  }>,
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
    const mode = await resolveInventoryMode(deps.inventorySettingsRepo, command.companyId)

    if (mode === 'SIMPLE') {
      const qtyByProduct = new Map<string, number>()
      for (const item of command.items) {
        if (item.qty <= 0) {
          return Result.err({ type: 'InvalidQuantity', message: 'qty must be > 0' })
        }
        qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.qty)
      }

      for (const [productId, qty] of qtyByProduct.entries()) {
        const product = await deps.productRepo.getById(command.companyId, ProductId.from(productId))
        if (!product) {
          return Result.err({ type: 'ProductNotFound', productId })
        }
        if (!product.active) {
          return Result.err({ type: 'InactiveProductOrVariant', productId })
        }

        const variant = await ensureSimpleDefaultVariant(deps, { companyId: command.companyId, product })
        movements.push({
          id: deps.idGenerator(),
          companyId: command.companyId,
          productId: ProductId.from(productId),
          variantId: variant.id,
          type: 'IN',
          qty: Quantity.from(qty),
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

      if (!item.variantId) {
        return Result.err({ type: 'VariantNotFound', variantId: item.productId })
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
