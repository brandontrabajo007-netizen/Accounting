"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSaleHandler = validateSaleHandler;
const dependencies_1 = require("../../dependencies");
const catalogSchemas_1 = require("../../validation/catalogSchemas");
async function validateSaleHandler(req, res) {
    const body = catalogSchemas_1.validateSaleSchema.parse(req.body);
    const result = await (0, dependencies_1.validateSaleCart)({ companyId: body.companyId, items: body.items });
    if (!result.ok) {
        return res.status(400).json({ ok: false, error: result.error });
    }
    return res.json({ ok: result.value.ok, issues: result.value.issues, normalizedItems: body.items });
}
