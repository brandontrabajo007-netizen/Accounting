import type { ProductRepo } from '../ports/ProductRepo'
import type { VariantRepo } from '../ports/VariantRepo'
import type { MovementRepo } from '../ports/MovementRepo'
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
  deps: Readonly<{ productRepo: ProductRepo; variantRepo: VariantRepo; movementRepo: MovementRepo; idGenerator: IdGenerator }>,
) {
  return async function registerReceipt(
    command: RegisterReceiptCommand,
  ): Promise<
    ResultType<{ movementBatchId: string }, ProductNotFound | VariantNotFound | InvalidQuantity | InactiveProductOrVariant>
  > {
    const batchId = deps.idGenerator()
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

      const variant = item.variantId
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
        return Result.err({ type: 'InactiveProductOrVariant', productId: item.productId, variantId: item.variantId })
      }

      movements.push({
        id: deps.idGenerator(),
        companyId: command.companyId,
        productId: ProductId.from(item.productId),
        variantId: variant.id,
        type: 'IN',
        qty: Quantity.from(item.qty),
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
