import type { ProductRepo } from '../ports/ProductRepo'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { ProductId } from '../../domain/value-objects/ProductId'
import type { ProductNotFound } from '../../domain/errors/ProductNotFound'

export type DeactivateProductCommand = Readonly<{
  companyId: string
  productId: string
}>

export function makeDeactivateProduct(deps: Readonly<{ productRepo: ProductRepo }>) {
  return async function deactivateProduct(command: DeactivateProductCommand): Promise<ResultType<{ ok: true }, ProductNotFound>> {
    const product = await deps.productRepo.getById(command.companyId, ProductId.from(command.productId))
    if (!product) {
      return Result.err({ type: 'ProductNotFound', productId: command.productId })
    }

    await deps.productRepo.deactivate(command.companyId, ProductId.from(command.productId))

    return Result.ok({ ok: true })
  }
}
