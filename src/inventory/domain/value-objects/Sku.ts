export type Sku = string & { readonly __brand: 'Sku' }

export const Sku = {
  from(value: string): Sku {
    return value as Sku
  },
}
