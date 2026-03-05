import type { Product } from '../../../domain/entities/Product'

export function serializeAdminProduct(product: Product) {
  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    costUnit: product.costUnit,
    active: product.active,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

export function serializeCatalogProduct(product: Product) {
  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    active: product.active,
  }
}
