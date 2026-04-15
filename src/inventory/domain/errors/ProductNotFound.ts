export type ProductNotFound = Readonly<{
  type: 'ProductNotFound'
  productId: string
}>

export type ProductHasMovements = Readonly<{
  type: 'ProductHasMovements'
  productId: string
}>

export type ProductHasActiveReservations = Readonly<{
  type: 'ProductHasActiveReservations'
  productId: string
}>
