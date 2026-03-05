"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMovementsHandler = listMovementsHandler;
const dependencies_1 = require("../../dependencies");
const adminSchemas_1 = require("../../validation/adminSchemas");
const movementSerializers_1 = require("../../serializers/movementSerializers");
const ProductId_1 = require("../../../../domain/value-objects/ProductId");
const VariantId_1 = require("../../../../domain/value-objects/VariantId");
async function listMovementsHandler(req, res) {
    const companyId = req.user.companyId;
    const query = adminSchemas_1.listMovementsQuerySchema.parse(req.query);
    const result = await dependencies_1.movementRepo.list({
        companyId,
        productId: query.productId ? ProductId_1.ProductId.from(query.productId) : undefined,
        variantId: query.variantId ? VariantId_1.VariantId.from(query.variantId) : undefined,
        type: query.type,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
        page: query.page,
        pageSize: query.pageSize,
    });
    return res.json({
        items: result.items.map(movementSerializers_1.serializeMovement),
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
    });
}
