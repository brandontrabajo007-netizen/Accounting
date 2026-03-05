export function serializeStock(availableQty: number, reservedQty?: number) {
  return {
    availableQty,
    reservedQty: reservedQty ?? 0,
  }
}
