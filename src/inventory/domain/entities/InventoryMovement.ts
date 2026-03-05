import type { ProductId } from '../value-objects/ProductId'
import type { Quantity } from '../value-objects/Quantity'
import type { VariantId } from '../value-objects/VariantId'

export type MovementType = 'IN' | 'OUT' | 'ADJUST'
export type MovementReferenceType = 'SALE' | 'PURCHASE' | 'MANUAL' | 'ADJUSTMENT' | 'REVERSAL'

export type InventoryMovementReference = Readonly<{
  type: MovementReferenceType
  id: string
}>

export type InventoryMovementBase = Readonly<{
  id: string
  companyId: string
  productId: ProductId
  variantId: VariantId
  type: MovementType
  occurredAt: Date
  reference: InventoryMovementReference
  batchId: string
  note?: string
  createdAt: Date
}>

export type InventoryMovementInOut = InventoryMovementBase &
  Readonly<{
    type: 'IN' | 'OUT'
    qty: Quantity
  }>

export type InventoryMovementAdjust = InventoryMovementBase &
  Readonly<{
    type: 'ADJUST'
    qtyDelta: number
  }>

export type InventoryMovement = InventoryMovementInOut | InventoryMovementAdjust
