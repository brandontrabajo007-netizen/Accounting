"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalSaleReverseHandler = internalSaleReverseHandler;
const dependencies_1 = require("../../dependencies");
const internalSchemas_1 = require("../../validation/internalSchemas");
async function internalSaleReverseHandler(req, res) {
    const body = internalSchemas_1.internalReverseSchema.parse(req.body);
    if (req.user?.companyId && req.user.companyId !== body.companyId) {
        return res.status(403).json({ ok: false, error: 'Acceso denegado' });
    }
    const result = await (0, dependencies_1.reverseSale)(body);
    if (!result.ok) {
        return res.status(400).json({ ok: false, error: result.error });
    }
    return res.json({ ok: true, movementBatchId: result.value.movementBatchId });
}
