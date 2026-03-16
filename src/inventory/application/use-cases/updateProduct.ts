import type { ProductRepo } from '../ports/ProductRepo'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { ProductId } from '../../domain/value-objects/ProductId'
import type { ProductNotFound } from '../../domain/errors/ProductNotFound'
import type { InvalidQuantity } from '../../domain/errors/InvalidQuantity'
import type { Product } from '../../domain/entities/Product'

export type UpdateProductCommand = Readonly<{
  companyId: string
  productId: string
  name?: string
  costUnit?: number
  saleUnit?: number
  active?: boolean
}>

export function makeUpdateProduct(deps: Readonly<{ productRepo: ProductRepo }>) {
  return async function updateProduct(
    command: UpdateProductCommand,
  ): Promise<ResultType<{ product: Product }, ProductNotFound | InvalidQuantity>> {
    const product = await deps.productRepo.getById(command.companyId, ProductId.from(command.productId))
    if (!product) {
      return Result.err({ type: 'ProductNotFound', productId: command.productId })
    }

    if (command.costUnit !== undefined && command.costUnit < 0) {
      return Result.err({ type: 'InvalidQuantity', message: 'costUnit must be >= 0' })
    }
    if (command.saleUnit !== undefined && command.saleUnit < 0) {
      return Result.err({ type: 'InvalidQuantity', message: 'saleUnit must be >= 0' })
    }

    const updated: Product = {
      ...product,
      name: command.name ?? product.name,
      costUnit: command.costUnit ?? product.costUnit,
      saleUnit: command.saleUnit ?? product.saleUnit,
      active: command.active ?? product.active,
      updatedAt: new Date(),
    }

    await deps.productRepo.update(updated)

    return Result.ok({ product: updated })
  }
}
