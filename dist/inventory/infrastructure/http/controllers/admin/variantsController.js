"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVariantHandler = createVariantHandler;
exports.listVariantsHandler = listVariantsHandler;
exports.updateVariantHandler = updateVariantHandler;
exports.deleteVariantHandler = deleteVariantHandler;
exports.deleteVariantHardHandler = deleteVariantHardHandler;
const dependencies_1 = require("../../dependencies");
const adminSchemas_1 = require("../../validation/adminSchemas");
const variantSerializers_1 = require("../../serializers/variantSerializers");
const ProductId_1 = require("../../../../domain/value-objects/ProductId");
const simpleModeError = { type: 'InventoryModeViolation', mode: 'SIMPLE', operation: 'VARIANT_MANAGEMENT' };
async function createVariantHandler(req, res) {
    const companyId = req.user.companyId;
    const settings = await (0, dependencies_1.getInventorySettings)({ companyId });
    if (settings.mode === 'SIMPLE') {
        return res.status(409).json({ ok: false, error: simpleModeError });
    }
    const { productId } = req.params;
    const body = adminSchemas_1.createVariantSchema.parse(req.body);
    const result = await (0, dependencies_1.createVariant)({
        companyId,
        productId,
        attribute: body.attribute,
        value: body.value,
        skuVariant: body.skuVariant,
        active: body.active,
    });
    if (!result.ok) {
        return res.status(400).json({ ok: false, error: result.error });
    }
    return res.status(201).json({ ok: true, variantId: result.value.variantId });
}
async function listVariantsHandler(req, res) {
    const companyId = req.user.companyId;
    const settings = await (0, dependencies_1.getInventorySettings)({ companyId });
    if (settings.mode === 'SIMPLE') {
        return res.json({ items: [] });
    }
    const { productId } = req.params;
    const variants = await dependencies_1.variantRepo.listByProductId(companyId, ProductId_1.ProductId.from(productId));
    return res.json({ items: variants.filter((variant) => variant.systemType !== 'SIMPLE_DEFAULT').map(variantSerializers_1.serializeVariant) });
}
async function updateVariantHandler(req, res) {
    const companyId = req.user.companyId;
    const settings = await (0, dependencies_1.getInventorySettings)({ companyId });
    if (settings.mode === 'SIMPLE') {
        return res.status(409).json({ ok: false, error: simpleModeError });
    }
    const { variantId } = req.params;
    const body = adminSchemas_1.updateVariantSchema.parse(req.body);
    const result = await (0, dependencies_1.updateVariant)({ companyId, variantId, ...body });
    if (!result.ok) {
        return res.status(400).json({ ok: false, error: result.error });
    }
    return res.json({ ok: true, item: (0, variantSerializers_1.serializeVariant)(result.value.variant) });
}
async function deleteVariantHandler(req, res) {
    const companyId = req.user.companyId;
    const settings = await (0, dependencies_1.getInventorySettings)({ companyId });
    if (settings.mode === 'SIMPLE') {
        return res.status(409).json({ ok: false, error: simpleModeError });
    }
    const { variantId } = req.params;
    const result = await (0, dependencies_1.deactivateVariant)({ companyId, variantId });
    if (!result.ok) {
        return res.status(400).json({ ok: false, error: result.error });
    }
    return res.json({ ok: true });
}
async function deleteVariantHardHandler(req, res) {
    const companyId = req.user.companyId;
    const settings = await (0, dependencies_1.getInventorySettings)({ companyId });
    if (settings.mode === 'SIMPLE') {
        return res.status(409).json({ ok: false, error: simpleModeError });
    }
    const { variantId } = req.params;
    const result = await (0, dependencies_1.deleteVariant)({ companyId, variantId });
    if (!result.ok) {
        if (result.error.type === 'VariantHasMovements') {
            return res.status(409).json({ ok: false, error: result.error });
        }
        return res.status(400).json({ ok: false, error: result.error });
    }
    return res.json({ ok: true });
}
