import type { MovementRepo } from '../ports/MovementRepo'
import type { ProductRepo } from '../ports/ProductRepo'
import type { VariantRepo } from '../ports/VariantRepo'
import type { ReservationRepo } from '../ports/ReservationRepo'
import type { InventorySettingsRepo } from '../ports/InventorySettingsRepo'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { ProductId } from '../../domain/value-objects/ProductId'
import { VariantId } from '../../domain/value-objects/VariantId'
import type { InsufficientStock } from '../../domain/errors/InsufficientStock'
import type { ProductNotFound } from '../../domain/errors/ProductNotFound'
import type { VariantNotFound } from '../../domain/errors/VariantNotFound'
import type { InactiveProductOrVariant } from '../../domain/errors/InactiveProductOrVariant'
import { computeAvailableStock } from '../../domain/services/computeAvailableStock'
import { resolveInventoryMode } from '../services/resolveInventoryMode'

export type ValidateSaleItem = Readonly<{
  productId: string
  variantId?: string
  qty: number
}>

export type ValidateSaleCartCommand = Readonly<{
  companyId: string
  items: ReadonlyArray<ValidateSaleItem>
}>

export type ValidateSaleCartIssue = Readonly<{
  productId: string
  variantId: string
  reason: 'INSUFFICIENT_STOCK' | 'NOT_FOUND' | 'INACTIVE'
  availableQty?: number
}>

export function makeValidateSaleCart(
  deps: Readonly<{
    productRepo: ProductRepo
    variantRepo: VariantRepo
    movementRepo: MovementRepo
    reservationRepo?: ReservationRepo
    inventorySettingsRepo: InventorySettingsRepo
  }>,
) {
  return async function validateSaleCart(
    command: ValidateSaleCartCommand,
  ): Promise<
    ResultType<
      { ok: boolean; issues: ReadonlyArray<ValidateSaleCartIssue> },
      ProductNotFound | VariantNotFound | InactiveProductOrVariant | InsufficientStock
    >
  > {
    const issues: ValidateSaleCartIssue[] = []
    const mode = await resolveInventoryMode(deps.inventorySettingsRepo, command.companyId)

    if (mode === 'SIMPLE') {
      const requestedByProduct = new Map<string, number>()
      for (const item of command.items) {
        const current = requestedByProduct.get(item.productId) ?? 0
        requestedByProduct.set(item.productId, current + item.qty)
      }

      for (const [productId, requestedQty] of requestedByProduct.entries()) {
        const product = await deps.productRepo.getById(command.companyId, ProductId.from(productId))
        if (!product) {
          issues.push({ productId, variantId: productId, reason: 'NOT_FOUND' })
          continue
        }
        if (!product.active) {
          issues.push({ productId, variantId: productId, reason: 'INACTIVE' })
          continue
        }

        const movements = await deps.movementRepo.listByProduct(command.companyId, product.id)
        const reservedActiveQty = deps.reservationRepo
          ? await deps.reservationRepo.listActiveQtyByProduct(command.companyId, product.id)
          : 0

        const stock = computeAvailableStock(movements, reservedActiveQty)
        if (stock.availableQty < requestedQty) {
          issues.push({
            productId,
            variantId: productId,
            reason: 'INSUFFICIENT_STOCK',
            availableQty: stock.availableQty,
          })
        }
      }

      return Result.ok({ ok: issues.length === 0, issues })
    }

    for (const item of command.items) {
      const product = await deps.productRepo.getById(command.companyId, ProductId.from(item.productId))
      if (!product) {
        issues.push({ productId: item.productId, variantId: item.variantId ?? item.productId, reason: 'NOT_FOUND' })
        continue
      }
      if (!product.active) {
        issues.push({ productId: item.productId, variantId: item.variantId ?? item.productId, reason: 'INACTIVE' })
        continue
      }

      if (!item.variantId) {
        issues.push({ productId: item.productId, variantId: item.productId, reason: 'NOT_FOUND' })
        continue
      }

      const variant = await deps.variantRepo.getById(command.companyId, VariantId.from(item.variantId))
      if (!variant) {
        issues.push({ productId: item.productId, variantId: item.variantId, reason: 'NOT_FOUND' })
        continue
      }
      if (!variant.active) {
        issues.push({ productId: item.productId, variantId: item.variantId, reason: 'INACTIVE' })
        continue
      }

      const movements = await deps.movementRepo.listByProductAndVariant(command.companyId, product.id, variant.id)
      const reservedActiveQty = deps.reservationRepo
        ? await deps.reservationRepo.listActiveQtyByVariant(command.companyId, VariantId.from(item.variantId))
        : 0

      const stock = computeAvailableStock(movements, reservedActiveQty)

      if (stock.availableQty < item.qty) {
        issues.push({
          productId: item.productId,
          variantId: item.variantId,
          reason: 'INSUFFICIENT_STOCK',
          availableQty: stock.availableQty,
        })
      }
    }

    return Result.ok({ ok: issues.length === 0, issues })
  }
}
