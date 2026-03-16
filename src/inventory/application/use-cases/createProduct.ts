import type { ProductRepo } from '../ports/ProductRepo'
import type { IdGenerator } from '../types/IdGenerator'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { ProductId } from '../../domain/value-objects/ProductId'
import { Sku } from '../../domain/value-objects/Sku'
import type { DuplicateSku } from '../../domain/errors/DuplicateSku'
import type { InvalidQuantity } from '../../domain/errors/InvalidQuantity'
import type { Product } from '../../domain/entities/Product'

export type CreateProductCommand = Readonly<{
  companyId: string
  name: string
  sku: string
  costUnit: number
  saleUnit?: number
  active: boolean
}>

export type CreateProductResult = Readonly<{
  productId: ProductId
}>

export function makeCreateProduct(deps: Readonly<{ productRepo: ProductRepo; idGenerator: IdGenerator }>) {
  return async function createProduct(
    command: CreateProductCommand,
  ): Promise<ResultType<CreateProductResult, DuplicateSku | InvalidQuantity>> {
    if (command.costUnit < 0) {
      return Result.err({ type: 'InvalidQuantity', message: 'costUnit must be >= 0' })
    }
    if (command.saleUnit !== undefined && command.saleUnit < 0) {
      return Result.err({ type: 'InvalidQuantity', message: 'saleUnit must be >= 0' })
    }

    const existing = await deps.productRepo.getBySku(command.companyId, Sku.from(command.sku))
    if (existing) {
      return Result.err({ type: 'DuplicateSku', sku: command.sku })
    }

    const now = new Date()
    const product: Product = {
      id: ProductId.from(deps.idGenerator()),
      companyId: command.companyId,
      name: command.name,
      sku: Sku.from(command.sku),
      costUnit: command.costUnit,
      saleUnit: command.saleUnit ?? command.costUnit,
      active: command.active,
      createdAt: now,
      updatedAt: now,
    }

    await deps.productRepo.create(product)

    return Result.ok({ productId: product.id })
  }
}
