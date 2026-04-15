import type { InventoryMovement } from '../../../domain/entities/InventoryMovement'

type MovementProductInfo = {
  name?: string
  sku?: string
}

export function serializeMovement(movement: InventoryMovement, productInfo?: MovementProductInfo) {
  const liveName = productInfo?.name?.trim()
  const snapshotName = movement.productNameSnapshot?.trim()
  const productName = liveName
    ? liveName
    : snapshotName
      ? `Producto borrado (era: ${snapshotName})`
      : undefined
  const productSku = productInfo?.sku?.trim() || movement.productSkuSnapshot?.trim() || undefined

  return {
    movementId: movement.id,
    productId: movement.productId,
    productName,
    productSku,
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
