"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeAvailableStock = computeAvailableStock;
function computeAvailableStock(movements, reservedActiveQty = 0) {
    let total = 0;
    for (const movement of movements) {
        if (movement.type === 'ADJUST') {
            total += movement.qtyDelta;
        }
        else if (movement.type === 'IN') {
            total += movement.qty;
        }
        else {
            total -= movement.qty;
        }
    }
    const availableQty = total - reservedActiveQty;
    return {
        availableQty,
        reservedQty: reservedActiveQty,
    };
}
