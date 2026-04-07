"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMovementsHandler = listMovementsHandler;
const dependencies_1 = require("../../dependencies");
const adminSchemas_1 = require("../../validation/adminSchemas");
const movementSerializers_1 = require("../../serializers/movementSerializers");
const ProductId_1 = require("../../../../domain/value-objects/ProductId");
const VariantId_1 = require("../../../../domain/value-objects/VariantId");
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const parseDateFilter = (value, bound) => {
    if (dateOnlyPattern.test(value)) {
        return new Date(bound === 'from' ? `${value}T00:00:00.000Z` : `${value}T23:59:59.999Z`);
    }
    return new Date(value);
};
async function listMovementsHandler(req, res) {
    const companyId = req.user.companyId;
    const parsed = adminSchemas_1.listMovementsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({
            ok: false,
            error: 'Filtros invalidos. Usa from/to como YYYY-MM-DD o ISO datetime.',
            details: parsed.error.flatten(),
        });
    }
    const query = parsed.data;
    const from = query.from ? parseDateFilter(query.from, 'from') : undefined;
    const to = query.to ? parseDateFilter(query.to, 'to') : undefined;
    if (from && to && to < from) {
        return res.status(400).json({ ok: false, error: 'Rango invalido: to debe ser mayor o igual a from.' });
    }
    const result = await dependencies_1.movementRepo.list({
        companyId,
        productId: query.productId ? ProductId_1.ProductId.from(query.productId) : undefined,
        variantId: query.variantId ? VariantId_1.VariantId.from(query.variantId) : undefined,
        type: query.type,
        from,
        to,
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
