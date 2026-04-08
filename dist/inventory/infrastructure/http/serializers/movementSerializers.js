"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeMovement = serializeMovement;
function serializeMovement(movement) {
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
    };
}
