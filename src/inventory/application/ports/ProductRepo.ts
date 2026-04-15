import type { Product } from '../../domain/entities/Product'
import type { ProductId } from '../../domain/value-objects/ProductId'
import type { Sku } from '../../domain/value-objects/Sku'

export type ProductListQuery = Readonly<{
  companyId: string
  q?: string
  active?: boolean
  page: number
  pageSize: number
}>

export type ProductListResult = Readonly<{
  items: ReadonlyArray<Product>
  total: number
}>

export interface ProductRepo {
  getById(companyId: string, id: ProductId): Promise<Product | null>
  getBySku(companyId: string, sku: Sku): Promise<Product | null>
  create(product: Product): Promise<void>
  update(product: Product): Promise<void>
  deactivate(companyId: string, id: ProductId): Promise<void>
  delete(companyId: string, id: ProductId): Promise<void>
  list(query: ProductListQuery): Promise<ProductListResult>
}
