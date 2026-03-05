export type VariantId = string & { readonly __brand: 'VariantId' }

export const VariantId = {
  from(value: string): VariantId {
    return value as VariantId
  },
}
