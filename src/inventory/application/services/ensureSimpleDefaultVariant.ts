import type { VariantRepo } from '../ports/VariantRepo'
import type { IdGenerator } from '../types/IdGenerator'
import type { Product } from '../../domain/entities/Product'
import type { Variant } from '../../domain/entities/Variant'
import { VariantId } from '../../domain/value-objects/VariantId'

export async function ensureSimpleDefaultVariant(
  deps: Readonly<{ variantRepo: VariantRepo; idGenerator: IdGenerator }>,
  input: Readonly<{ companyId: string; product: Product }>,
): Promise<Variant> {
  const existing = await deps.variantRepo.getSimpleDefaultByProductId(input.companyId, input.product.id)
  if (existing) {
    if (existing.active) return existing

    const reactivated: Variant = {
      ...existing,
      active: true,
      updatedAt: new Date(),
    }
    await deps.variantRepo.update(reactivated)
    return reactivated
  }

  const now = new Date()
  const created: Variant = {
    id: VariantId.from(deps.idGenerator()),
    companyId: input.companyId,
    productId: input.product.id,
    attribute: 'presentacion',
    value: 'general',
    systemType: 'SIMPLE_DEFAULT',
    active: true,
    createdAt: now,
    updatedAt: now,
  }

  await deps.variantRepo.create(created)
  return created
}
