import type { InventoryMovement, MovementReferenceType } from '../../domain/entities/InventoryMovement'
import type { ProductId } from '../../domain/value-objects/ProductId'
import type { VariantId } from '../../domain/value-objects/VariantId'

export type MovementListQuery = Readonly<{
  companyId: string
  productId?: ProductId
  variantId?: VariantId
  type?: 'IN' | 'OUT' | 'ADJUST'
  from?: Date
  to?: Date
  page: number
  pageSize: number
}>

export type MovementListResult = Readonly<{
  items: ReadonlyArray<InventoryMovement>
  total: number
}>

export interface MovementRepo {
  addMany(movements: ReadonlyArray<InventoryMovement>): Promise<void>
  findByReference(
    companyId: string,
    referenceType: MovementReferenceType,
    referenceId: string,
  ): Promise<ReadonlyArray<InventoryMovement>>
  list(query: MovementListQuery): Promise<MovementListResult>
  listByProductAndVariant(
    companyId: string,
    productId: ProductId,
    variantId: VariantId,
  ): Promise<ReadonlyArray<InventoryMovement>>
  listByProduct(companyId: string, productId: ProductId): Promise<ReadonlyArray<InventoryMovement>>
  listByVariant(companyId: string, variantId: VariantId): Promise<ReadonlyArray<InventoryMovement>>
  existsByVariant(companyId: string, variantId: VariantId): Promise<boolean>
  existsByCompany(companyId: string): Promise<boolean>
}
