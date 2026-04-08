import type { Variant } from '../../domain/entities/Variant'
import type { ProductId } from '../../domain/value-objects/ProductId'
import type { VariantId } from '../../domain/value-objects/VariantId'

export interface VariantRepo {
  getById(companyId: string, id: VariantId): Promise<Variant | null>
  listByProductId(companyId: string, productId: ProductId): Promise<ReadonlyArray<Variant>>
  listByCompanyId(companyId: string): Promise<ReadonlyArray<Variant>>
  getSimpleDefaultByProductId(companyId: string, productId: ProductId): Promise<Variant | null>
  existsUserManagedByCompany(companyId: string): Promise<boolean>
  getByProductAndAttributeValue(
    companyId: string,
    productId: ProductId,
    attribute: string,
    value: string,
  ): Promise<Variant | null>
  create(variant: Variant): Promise<void>
  update(variant: Variant): Promise<void>
  deactivate(companyId: string, variantId: VariantId): Promise<void>
  delete(companyId: string, variantId: VariantId): Promise<void>
}
