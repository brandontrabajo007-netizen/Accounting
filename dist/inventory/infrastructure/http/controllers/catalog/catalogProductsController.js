"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCatalogProductsHandler = listCatalogProductsHandler;
exports.getCatalogProductHandler = getCatalogProductHandler;
exports.getCatalogAvailabilityHandler = getCatalogAvailabilityHandler;
const dependencies_1 = require("../../dependencies");
const catalogSchemas_1 = require("../../validation/catalogSchemas");
const productSerializers_1 = require("../../serializers/productSerializers");
const variantSerializers_1 = require("../../serializers/variantSerializers");
const computeAvailableStock_1 = require("../../../../domain/services/computeAvailableStock");
const ProductId_1 = require("../../../../domain/value-objects/ProductId");
async function listCatalogProductsHandler(req, res) {
    const query = catalogSchemas_1.catalogListQuerySchema.parse(req.query);
    const result = await dependencies_1.productRepo.list({
        companyId: query.companyId,
        q: query.q,
        active: true,
        page: query.page,
        pageSize: query.pageSize,
    });
    return res.json({
        items: result.items.map(productSerializers_1.serializeCatalogProduct),
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
    });
}
async function getCatalogProductHandler(req, res) {
    const query = catalogSchemas_1.catalogCompanyQuerySchema.parse(req.query);
    const { productId } = req.params;
    const product = await dependencies_1.productRepo.getById(query.companyId, ProductId_1.ProductId.from(productId));
    if (!product || !product.active) {
        return res.status(404).json({ ok: false, error: 'ProductNotFound' });
    }
    const variants = await dependencies_1.variantRepo.listByProductId(query.companyId, ProductId_1.ProductId.from(productId));
    const activeVariants = variants.filter((variant) => variant.active);
    return res.json({
        product: (0, productSerializers_1.serializeCatalogProduct)(product),
        variants: activeVariants.map(variantSerializers_1.serializeVariant),
    });
}
async function getCatalogAvailabilityHandler(req, res) {
    const query = catalogSchemas_1.catalogCompanyQuerySchema.parse(req.query);
    const { productId } = req.params;
    const product = await dependencies_1.productRepo.getById(query.companyId, ProductId_1.ProductId.from(productId));
    if (!product || !product.active) {
        return res.status(404).json({ ok: false, error: 'ProductNotFound' });
    }
    const variants = await dependencies_1.variantRepo.listByProductId(query.companyId, ProductId_1.ProductId.from(productId));
    const activeVariants = variants.filter((variant) => variant.active);
    const items = [];
    for (const variant of activeVariants) {
        const movements = await dependencies_1.movementRepo.listByProductAndVariant(query.companyId, variant.productId, variant.id);
        const reservedQty = await dependencies_1.reservationRepo.listActiveQtyByVariant(query.companyId, variant.id);
        const stock = (0, computeAvailableStock_1.computeAvailableStock)(movements, reservedQty);
        items.push({ variantId: variant.id, availableQty: stock.availableQty });
    }
    return res.json({ items });
}
