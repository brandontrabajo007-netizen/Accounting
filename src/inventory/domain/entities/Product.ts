import type { ProductId } from '../value-objects/ProductId'
import type { Sku } from '../value-objects/Sku'

export type Product = Readonly<{
  id: ProductId
  companyId: string
  name: string
  sku: Sku
  costUnit: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}>
