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
    const settings = await (0, dependencies_1.getInventorySettings)({ companyId: query.companyId });
    const result = await dependencies_1.productRepo.list({
        companyId: query.companyId,
        q: query.q,
        active: true,
        page: query.page,
        pageSize: query.pageSize,
    });
    return res.json({
        mode: settings.mode,
        items: result.items.map(productSerializers_1.serializeCatalogProduct),
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
    });
}
async function getCatalogProductHandler(req, res) {
    const query = catalogSchemas_1.catalogCompanyQuerySchema.parse(req.query);
    const settings = await (0, dependencies_1.getInventorySettings)({ companyId: query.companyId });
    const { productId } = req.params;
    const product = await dependencies_1.productRepo.getById(query.companyId, ProductId_1.ProductId.from(productId));
    if (!product || !product.active) {
        return res.status(404).json({ ok: false, error: 'ProductNotFound' });
    }
    if (settings.mode === 'SIMPLE') {
        return res.json({
            mode: settings.mode,
            product: (0, productSerializers_1.serializeCatalogProduct)(product),
            variants: [],
        });
    }
    const variants = await dependencies_1.variantRepo.listByProductId(query.companyId, ProductId_1.ProductId.from(productId));
    const activeVariants = variants.filter((variant) => variant.active && variant.systemType !== 'SIMPLE_DEFAULT');
    return res.json({
        mode: settings.mode,
        product: (0, productSerializers_1.serializeCatalogProduct)(product),
        variants: activeVariants.map(variantSerializers_1.serializeVariant),
    });
}
async function getCatalogAvailabilityHandler(req, res) {
    const query = catalogSchemas_1.catalogCompanyQuerySchema.parse(req.query);
    const settings = await (0, dependencies_1.getInventorySettings)({ companyId: query.companyId });
    const { productId } = req.params;
    const product = await dependencies_1.productRepo.getById(query.companyId, ProductId_1.ProductId.from(productId));
    if (!product || !product.active) {
        return res.status(404).json({ ok: false, error: 'ProductNotFound' });
    }
    if (settings.mode === 'SIMPLE') {
        const movements = await dependencies_1.movementRepo.listByProduct(query.companyId, ProductId_1.ProductId.from(productId));
        const reservedQty = await dependencies_1.reservationRepo.listActiveQtyByProduct(query.companyId, ProductId_1.ProductId.from(productId));
        const stock = (0, computeAvailableStock_1.computeAvailableStock)(movements, reservedQty);
        return res.json({ mode: settings.mode, items: [{ variantId: productId, availableQty: stock.availableQty }] });
    }
    const variants = await dependencies_1.variantRepo.listByProductId(query.companyId, ProductId_1.ProductId.from(productId));
    const activeVariants = variants.filter((variant) => variant.active && variant.systemType !== 'SIMPLE_DEFAULT');
    const items = [];
    for (const variant of activeVariants) {
        const movements = await dependencies_1.movementRepo.listByProductAndVariant(query.companyId, variant.productId, variant.id);
        const reservedQty = await dependencies_1.reservationRepo.listActiveQtyByVariant(query.companyId, variant.id);
        const stock = (0, computeAvailableStock_1.computeAvailableStock)(movements, reservedQty);
        items.push({ variantId: variant.id, availableQty: stock.availableQty });
    }
    return res.json({ mode: settings.mode, items });
}
