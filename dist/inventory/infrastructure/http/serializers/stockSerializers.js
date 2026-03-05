"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeStock = serializeStock;
function serializeStock(availableQty, reservedQty) {
    return {
        availableQty,
        reservedQty: reservedQty ?? 0,
    };
}
