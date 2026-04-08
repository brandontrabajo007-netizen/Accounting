import type { MovementRepo } from '../ports/MovementRepo'
import type { ProductRepo } from '../ports/ProductRepo'
import type { VariantRepo } from '../ports/VariantRepo'
import type { ReservationRepo } from '../ports/ReservationRepo'
import type { InventorySettingsRepo } from '../ports/InventorySettingsRepo'
import type { IdGenerator } from '../types/IdGenerator'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { ProductId } from '../../domain/value-objects/ProductId'
import { Quantity } from '../../domain/value-objects/Quantity'
import { VariantId } from '../../domain/value-objects/VariantId'
import type { InsufficientStock } from '../../domain/errors/InsufficientStock'
import type { ProductNotFound } from '../../domain/errors/ProductNotFound'
import type { VariantNotFound } from '../../domain/errors/VariantNotFound'
import type { InvalidQuantity } from '../../domain/errors/InvalidQuantity'
import type { InactiveProductOrVariant } from '../../domain/errors/InactiveProductOrVariant'
import type { InventoryMovement } from '../../domain/entities/InventoryMovement'
import { computeAvailableStock } from '../../domain/services/computeAvailableStock'
import { makeGetSaleCost } from './getSaleCost'
import { resolveInventoryMode } from '../services/resolveInventoryMode'
import { ensureSimpleDefaultVariant } from '../services/ensureSimpleDefaultVariant'

export type ConfirmSaleCommand = Readonly<{
  companyId: string
  saleId: string
  items: ReadonlyArray<{ productId: string; variantId?: string; qty: number }>
  reference: string
  ignoreActiveReservations?: boolean
}>

export type ConfirmSaleResult = Readonly<{
  ok: true
  movementBatchId: string
  costTotal: number
}>

export function makeConfirmSale(
  deps: Readonly<{
    productRepo: ProductRepo
    variantRepo: VariantRepo
    movementRepo: MovementRepo
    reservationRepo?: ReservationRepo
    inventorySettingsRepo: InventorySettingsRepo
    idGenerator: IdGenerator
  }>,
) {
  const getSaleCost = makeGetSaleCost({ productRepo: deps.productRepo })

  return async function confirmSale(
    command: ConfirmSaleCommand,
  ): Promise<
    ResultType<
      ConfirmSaleResult,
      ProductNotFound | VariantNotFound | InvalidQuantity | InactiveProductOrVariant | InsufficientStock
    >
  > {
    const existing = await deps.movementRepo.findByReference(command.companyId, 'SALE', command.saleId)
    if (existing.length > 0) {
      const costResult = await getSaleCost({
        companyId: command.companyId,
        saleId: command.saleId,
        items: command.items,
      })
      if (!costResult.ok) {
        return costResult
      }
      return Result.ok({
        ok: true,
        movementBatchId: existing[0]?.batchId ?? command.saleId,
        costTotal: costResult.value.costTotal,
      })
    }

    const now = new Date()
    const movements: InventoryMovement[] = []
    const mode = await resolveInventoryMode(deps.inventorySettingsRepo, command.companyId)

    if (mode === 'SIMPLE') {
      const requestedByProduct = new Map<string, number>()
      for (const item of command.items) {
        if (item.qty <= 0) {
          return Result.err({ type: 'InvalidQuantity', message: 'qty must be > 0' })
        }
        const current = requestedByProduct.get(item.productId) ?? 0
        requestedByProduct.set(item.productId, current + item.qty)
      }

      for (const [productId, qty] of requestedByProduct.entries()) {
        const product = await deps.productRepo.getById(command.companyId, ProductId.from(productId))
        if (!product) {
          return Result.err({ type: 'ProductNotFound', productId })
        }
        if (!product.active) {
          return Result.err({ type: 'InactiveProductOrVariant', productId })
        }

        const variant = await ensureSimpleDefaultVariant(deps, { companyId: command.companyId, product })
        const movementsForProduct = await deps.movementRepo.listByProduct(command.companyId, product.id)
        const reservedActiveQty =
          deps.reservationRepo && !command.ignoreActiveReservations
            ? await deps.reservationRepo.listActiveQtyByProduct(command.companyId, product.id)
            : 0
        const stock = computeAvailableStock(movementsForProduct, reservedActiveQty)

        if (stock.availableQty < qty) {
          return Result.err({
            type: 'InsufficientStock',
            productId,
            variantId: variant.id,
            availableQty: stock.availableQty,
            requestedQty: qty,
          })
        }

        movements.push({
          id: deps.idGenerator(),
          companyId: command.companyId,
          productId: ProductId.from(productId),
          variantId: variant.id,
          type: 'OUT',
          qty: Quantity.from(qty),
          occurredAt: now,
          reference: { type: 'SALE', id: command.saleId },
          batchId: command.saleId,
          note: command.reference,
          createdAt: now,
        })
      }

      await deps.movementRepo.addMany(movements)

      const costResult = await getSaleCost({
        companyId: command.companyId,
        saleId: command.saleId,
        items: command.items,
      })
      if (!costResult.ok) {
        return costResult
      }

      return Result.ok({
        ok: true,
        movementBatchId: command.saleId,
        costTotal: costResult.value.costTotal,
      })
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

      const movementsForVariant = await deps.movementRepo.listByProductAndVariant(
        command.companyId,
        product.id,
        variant.id,
      )
      const reservedActiveQty =
        deps.reservationRepo && !command.ignoreActiveReservations
        ? await deps.reservationRepo.listActiveQtyByVariant(command.companyId, VariantId.from(item.variantId))
        : 0
      const stock = computeAvailableStock(movementsForVariant, reservedActiveQty)

      if (stock.availableQty < item.qty) {
        return Result.err({
          type: 'InsufficientStock',
          productId: item.productId,
          variantId: item.variantId,
          availableQty: stock.availableQty,
          requestedQty: item.qty,
        })
      }

      movements.push({
        id: deps.idGenerator(),
        companyId: command.companyId,
        productId: ProductId.from(item.productId),
        variantId: VariantId.from(item.variantId),
        type: 'OUT',
        qty: Quantity.from(item.qty),
        occurredAt: now,
        reference: { type: 'SALE', id: command.saleId },
        batchId: command.saleId,
        note: command.reference,
        createdAt: now,
      })
    }

    await deps.movementRepo.addMany(movements)

    const costResult = await getSaleCost({
      companyId: command.companyId,
      saleId: command.saleId,
      items: command.items,
    })
    if (!costResult.ok) {
      return costResult
    }

    return Result.ok({
      ok: true,
      movementBatchId: command.saleId,
      costTotal: costResult.value.costTotal,
    })
  }
}
