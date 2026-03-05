"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeVariant = serializeVariant;
function serializeVariant(variant) {
    return {
        variantId: variant.id,
        productId: variant.productId,
        attribute: variant.attribute,
        value: variant.value,
        skuVariant: variant.skuVariant,
        active: variant.active,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
    };
}
