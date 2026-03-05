import type { InventoryMovement } from '../entities/InventoryMovement'

export type StockComputation = Readonly<{
  availableQty: number
  reservedQty: number
}>

export function computeAvailableStock(
  movements: ReadonlyArray<InventoryMovement>,
  reservedActiveQty = 0,
): StockComputation {
  let total = 0

  for (const movement of movements) {
    if (movement.type === 'ADJUST') {
      total += movement.qtyDelta
    } else if (movement.type === 'IN') {
      total += movement.qty
    } else {
      total -= movement.qty
    }
  }

  const availableQty = total - reservedActiveQty

  return {
    availableQty,
    reservedQty: reservedActiveQty,
  }
}
