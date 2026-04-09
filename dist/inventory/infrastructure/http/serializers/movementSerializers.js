"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeMovement = serializeMovement;
function serializeMovement(movement, productInfo) {
    return {
        movementId: movement.id,
        productId: movement.productId,
        productName: productInfo?.name,
        productSku: productInfo?.sku,
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
