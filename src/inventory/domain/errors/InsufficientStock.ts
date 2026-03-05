export type InsufficientStock = Readonly<{
  type: 'InsufficientStock'
  productId: string
  variantId: string
  availableQty: number
  requestedQty: number
}>
