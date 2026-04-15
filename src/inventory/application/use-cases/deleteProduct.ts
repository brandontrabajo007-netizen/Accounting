import type { ProductRepo } from '../ports/ProductRepo'
import type { VariantRepo } from '../ports/VariantRepo'
import type { MovementRepo } from '../ports/MovementRepo'
import type { ReservationRepo } from '../ports/ReservationRepo'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { ProductId } from '../../domain/value-objects/ProductId'
import type { ProductNotFound, ProductHasActiveReservations } from '../../domain/errors/ProductNotFound'

export type DeleteProductCommand = Readonly<{
  companyId: string
  productId: string
}>

export function makeDeleteProduct(
  deps: Readonly<{
    productRepo: ProductRepo
    variantRepo: VariantRepo
    movementRepo: MovementRepo
    reservationRepo: ReservationRepo
  }>,
) {
  return async function deleteProduct(
    command: DeleteProductCommand,
  ): Promise<ResultType<{ ok: true }, ProductNotFound | ProductHasActiveReservations>> {
    const productId = ProductId.from(command.productId)
    const product = await deps.productRepo.getById(command.companyId, productId)
    if (!product) {
      return Result.err({ type: 'ProductNotFound', productId: command.productId })
    }

    const reservedQty = await deps.reservationRepo.listActiveQtyByProduct(command.companyId, productId)
    if (reservedQty > 0) {
      return Result.err({ type: 'ProductHasActiveReservations', productId: command.productId })
    }

    await deps.movementRepo.stampDeletedProductSnapshot(command.companyId, productId, {
      name: product.name,
      sku: product.sku,
    })

    const variants = await deps.variantRepo.listByProductId(command.companyId, productId)
    for (const variant of variants) {
      await deps.variantRepo.delete(command.companyId, variant.id)
    }

    await deps.productRepo.delete(command.companyId, productId)

    return Result.ok({ ok: true })
  }
}
