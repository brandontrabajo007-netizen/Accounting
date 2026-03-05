export type Quantity = number & { readonly __brand: 'Quantity' }

export const Quantity = {
  from(value: number): Quantity {
    return value as Quantity
  },
}
