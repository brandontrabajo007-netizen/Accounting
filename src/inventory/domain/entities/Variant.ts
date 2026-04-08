import type { ProductId } from '../value-objects/ProductId'
import type { Sku } from '../value-objects/Sku'
import type { VariantId } from '../value-objects/VariantId'

export type Variant = Readonly<{
  id: VariantId
  companyId: string
  productId: ProductId
  attribute: string
  value: string
  skuVariant?: Sku
  systemType?: 'SIMPLE_DEFAULT'
  active: boolean
  createdAt: Date
  updatedAt: Date
}>
