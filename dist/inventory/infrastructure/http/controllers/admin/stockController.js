"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStockHandler = getStockHandler;
exports.getProductStockHandler = getProductStockHandler;
exports.getVariantStockHandler = getVariantStockHandler;
exports.getGlobalStockHandler = getGlobalStockHandler;
const dependencies_1 = require("../../dependencies");
const adminSchemas_1 = require("../../validation/adminSchemas");
const computeAvailableStock_1 = require("../../../../domain/services/computeAvailableStock");
const ProductId_1 = require("../../../../domain/value-objects/ProductId");
const VariantId_1 = require("../../../../domain/value-objects/VariantId");
async function getStockHandler(req, res) {
    const companyId = req.user.companyId;
    const query = adminSchemas_1.stockQuerySchema.parse(req.query);
    if (query.variantId) {
        const movements = await dependencies_1.movementRepo.listByVariant(companyId, VariantId_1.VariantId.from(query.variantId));
        const reservedQty = await dependencies_1.reservationRepo.listActiveQtyByVariant(companyId, VariantId_1.VariantId.from(query.variantId));
        const stock = (0, computeAvailableStock_1.computeAvailableStock)(movements, reservedQty);
        return res.json({ availableQty: stock.availableQty, reservedQty: stock.reservedQty });
    }
    if (query.productId) {
        const variants = await dependencies_1.variantRepo.listByProductId(companyId, ProductId_1.ProductId.from(query.productId));
        let totalAvailable = 0;
        let totalReserved = 0;
        for (const variant of variants) {
            const movements = await dependencies_1.movementRepo.listByProductAndVariant(companyId, variant.productId, variant.id);
            const reservedQty = await dependencies_1.reservationRepo.listActiveQtyByVariant(companyId, variant.id);
            const stock = (0, computeAvailableStock_1.computeAvailableStock)(movements, reservedQty);
            totalAvailable += stock.availableQty;
            totalReserved += stock.reservedQty;
        }
        return res.json({ availableQty: totalAvailable, reservedQty: totalReserved });
    }
    return res.status(400).json({ ok: false, error: 'productId or variantId is required' });
}
async function getProductStockHandler(req, res) {
    const companyId = req.user.companyId;
    const { productId } = req.params;
    const variants = await dependencies_1.variantRepo.listByProductId(companyId, ProductId_1.ProductId.from(productId));
    const items = [];
    for (const variant of variants) {
        const movements = await dependencies_1.movementRepo.listByProductAndVariant(companyId, variant.productId, variant.id);
        const reservedQty = await dependencies_1.reservationRepo.listActiveQtyByVariant(companyId, variant.id);
        const stock = (0, computeAvailableStock_1.computeAvailableStock)(movements, reservedQty);
        items.push({ variantId: variant.id, availableQty: stock.availableQty, reservedQty: stock.reservedQty });
    }
    return res.json({ productId, items });
}
async function getVariantStockHandler(req, res) {
    const companyId = req.user.companyId;
    const { variantId } = req.params;
    const movements = await dependencies_1.movementRepo.listByVariant(companyId, VariantId_1.VariantId.from(variantId));
    const reservedQty = await dependencies_1.reservationRepo.listActiveQtyByVariant(companyId, VariantId_1.VariantId.from(variantId));
    const stock = (0, computeAvailableStock_1.computeAvailableStock)(movements, reservedQty);
    return res.json({ variantId, availableQty: stock.availableQty, reservedQty: stock.reservedQty });
}
async function getGlobalStockHandler(req, res) {
    const companyId = req.user.companyId;
    const products = await dependencies_1.productRepo.list({
        companyId,
        page: 1,
        pageSize: 10000,
    });
    const items = [];
    for (const product of products.items) {
        const variants = await dependencies_1.variantRepo.listByProductId(companyId, product.id);
        for (const variant of variants) {
            const movements = await dependencies_1.movementRepo.listByProductAndVariant(companyId, product.id, variant.id);
            const reservedQty = await dependencies_1.reservationRepo.listActiveQtyByVariant(companyId, variant.id);
            const stock = (0, computeAvailableStock_1.computeAvailableStock)(movements, reservedQty);
            items.push({
                productId: product.id,
                productName: product.name,
                variantId: variant.id,
                variantLabel: `${variant.attribute} ${variant.value}`.trim(),
                availableQty: stock.availableQty,
                reservedQty: stock.reservedQty,
            });
        }
    }
    return res.json({ items });
}
