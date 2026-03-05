import type { Variant } from '../../../domain/entities/Variant'

export function serializeVariant(variant: Variant) {
  return {
    variantId: variant.id,
    productId: variant.productId,
    attribute: variant.attribute,
    value: variant.value,
    skuVariant: variant.skuVariant,
    active: variant.active,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
  }
}
