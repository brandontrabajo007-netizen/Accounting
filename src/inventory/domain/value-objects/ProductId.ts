export type ProductId = string & { readonly __brand: 'ProductId' }

export const ProductId = {
  from(value: string): ProductId {
    return value as ProductId
  },
}
