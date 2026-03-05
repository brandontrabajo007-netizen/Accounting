import type { ProductId } from '../value-objects/ProductId'
import type { Quantity } from '../value-objects/Quantity'
import type { VariantId } from '../value-objects/VariantId'

export type ReservationStatus = 'ACTIVE' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'

export type ReservationItem = Readonly<{
  productId: ProductId
  variantId: VariantId
  qty: Quantity
}>

export type Reservation = Readonly<{
  id: string
  companyId: string
  items: ReadonlyArray<ReservationItem>
  status: ReservationStatus
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}>
