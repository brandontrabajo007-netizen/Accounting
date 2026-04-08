import type { ProductRepo } from '../ports/ProductRepo'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { ProductId } from '../../domain/value-objects/ProductId'
import { Quantity } from '../../domain/value-objects/Quantity'
import type { ProductNotFound } from '../../domain/errors/ProductNotFound'
import type { InvalidQuantity } from '../../domain/errors/InvalidQuantity'
import { computeCostFixed } from '../../domain/services/computeCostFixed'

export type SaleItem = Readonly<{
  productId: string
  variantId?: string
  qty: number
}>

export type GetSaleCostCommand = Readonly<{
  companyId: string
  saleId: string
  items: ReadonlyArray<SaleItem>
}>

export type CostBreakdownLine = Readonly<{
  productId: string
  qty: number
  unitCost: number
  lineCost: number
}>

export type GetSaleCostResult = Readonly<{
  saleId: string
  costTotal: number
  breakdown: ReadonlyArray<CostBreakdownLine>
}>

export function makeGetSaleCost(deps: Readonly<{ productRepo: ProductRepo }>) {
  return async function getSaleCost(
    command: GetSaleCostCommand,
  ): Promise<ResultType<GetSaleCostResult, ProductNotFound | InvalidQuantity>> {
    const aggregated = new Map<string, number>()

    for (const item of command.items) {
      if (item.qty <= 0) {
        return Result.err({ type: 'InvalidQuantity', message: 'qty must be > 0' })
      }
      const current = aggregated.get(item.productId) ?? 0
      aggregated.set(item.productId, current + item.qty)
    }

    const breakdown: CostBreakdownLine[] = []
    let totalAmount = 0

    for (const [productId, qty] of aggregated.entries()) {
      const product = await deps.productRepo.getById(command.companyId, ProductId.from(productId))
      if (!product) {
        return Result.err({ type: 'ProductNotFound', productId })
      }
      const cost = computeCostFixed(product, Quantity.from(qty))
      totalAmount += cost
      breakdown.push({
        productId,
        qty,
        unitCost: product.costUnit,
        lineCost: cost,
      })
    }

    return Result.ok({
      saleId: command.saleId,
      costTotal: totalAmount,
      breakdown,
    })
  }
}
