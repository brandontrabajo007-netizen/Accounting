"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductHandler = createProductHandler;
exports.listProductsHandler = listProductsHandler;
exports.getProductHandler = getProductHandler;
exports.updateProductHandler = updateProductHandler;
exports.deleteProductHandler = deleteProductHandler;
exports.deleteProductHardHandler = deleteProductHardHandler;
const dependencies_1 = require("../../dependencies");
const adminSchemas_1 = require("../../validation/adminSchemas");
const productSerializers_1 = require("../../serializers/productSerializers");
const ProductId_1 = require("../../../../domain/value-objects/ProductId");
async function createProductHandler(req, res) {
    const companyId = req.user.companyId;
    const body = adminSchemas_1.createProductSchema.parse(req.body);
    const result = await (0, dependencies_1.createProduct)({ companyId, ...body });
    if (!result.ok) {
        return res.status(400).json({ ok: false, error: result.error });
    }
    return res.status(201).json({ ok: true, productId: result.value.productId });
}
async function listProductsHandler(req, res) {
    const companyId = req.user.companyId;
    const query = adminSchemas_1.listProductsQuerySchema.parse(req.query);
    const result = await dependencies_1.productRepo.list({
        companyId,
        q: query.q,
        active: query.active,
        page: query.page,
        pageSize: query.pageSize,
    });
    return res.json({
        items: result.items.map(productSerializers_1.serializeAdminProduct),
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
    });
}
async function getProductHandler(req, res) {
    const companyId = req.user.companyId;
    const { productId } = req.params;
    const product = await dependencies_1.productRepo.getById(companyId, ProductId_1.ProductId.from(productId));
    if (!product) {
        return res.status(404).json({ ok: false, error: 'ProductNotFound' });
    }
    return res.json({ item: (0, productSerializers_1.serializeAdminProduct)(product) });
}
async function updateProductHandler(req, res) {
    const companyId = req.user.companyId;
    const { productId } = req.params;
    const body = adminSchemas_1.updateProductSchema.parse(req.body);
    const result = await (0, dependencies_1.updateProduct)({ companyId, productId, ...body });
    if (!result.ok) {
        return res.status(400).json({ ok: false, error: result.error });
    }
    return res.json({ ok: true, item: (0, productSerializers_1.serializeAdminProduct)(result.value.product) });
}
async function deleteProductHandler(req, res) {
    const companyId = req.user.companyId;
    const { productId } = req.params;
    const result = await (0, dependencies_1.deactivateProduct)({ companyId, productId });
    if (!result.ok) {
        if (result.error.type === 'ProductNotFound') {
            return res.status(404).json({ ok: false, error: result.error });
        }
        return res.status(400).json({ ok: false, error: result.error });
    }
    return res.json({ ok: true });
}
async function deleteProductHardHandler(req, res) {
    const companyId = req.user.companyId;
    const { productId } = req.params;
    const result = await (0, dependencies_1.deleteProduct)({ companyId, productId });
    if (!result.ok) {
        if (result.error.type === 'ProductNotFound') {
            return res.status(404).json({ ok: false, error: result.error });
        }
        if (result.error.type === 'ProductHasActiveReservations') {
            return res.status(409).json({ ok: false, error: result.error });
        }
        return res.status(400).json({ ok: false, error: result.error });
    }
    return res.json({ ok: true });
}
