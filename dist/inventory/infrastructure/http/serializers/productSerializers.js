"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeAdminProduct = serializeAdminProduct;
exports.serializeCatalogProduct = serializeCatalogProduct;
function serializeAdminProduct(product) {
    return {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        costUnit: product.costUnit,
        saleUnit: product.saleUnit,
        active: product.active,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}
function serializeCatalogProduct(product) {
    return {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        active: product.active,
    };
}
