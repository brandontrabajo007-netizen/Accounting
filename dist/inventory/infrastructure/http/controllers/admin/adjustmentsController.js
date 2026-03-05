"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdjustmentHandler = registerAdjustmentHandler;
const dependencies_1 = require("../../dependencies");
const adminSchemas_1 = require("../../validation/adminSchemas");
async function registerAdjustmentHandler(req, res) {
    const companyId = req.user.companyId;
    const body = adminSchemas_1.registerAdjustmentSchema.parse(req.body);
    const result = await (0, dependencies_1.registerAdjustment)({ companyId, reason: body.reason, items: body.items });
    if (!result.ok) {
        return res.status(400).json({ ok: false, error: result.error });
    }
    return res.status(201).json({ ok: true, movementBatchId: result.value.movementBatchId });
}
