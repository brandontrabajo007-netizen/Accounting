import type { Product } from '../entities/Product'
import type { Quantity } from '../value-objects/Quantity'

export function computeCostFixed(product: Product, qty: Quantity): number {
  return product.costUnit * qty
}
