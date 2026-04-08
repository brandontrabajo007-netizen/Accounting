import type { InventoryMovement } from '../../../domain/entities/InventoryMovement'

export function serializeMovement(movement: InventoryMovement) {
  return {
    movementId: movement.id,
    productId: movement.productId,
    variantId: movement.variantId,
    type: movement.type,
    qty: movement.type === 'ADJUST' ? movement.qtyDelta : movement.qty,
    qtyDelta: movement.type === 'ADJUST' ? movement.qtyDelta : undefined,
    occurredAt: movement.occurredAt,
    reference: movement.reference,
    batchId: movement.batchId,
    note: movement.note,
    createdAt: movement.createdAt,
  }
}
