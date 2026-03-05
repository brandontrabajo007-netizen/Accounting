"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReceiptHandler = registerReceiptHandler;
const dependencies_1 = require("../../dependencies");
const adminSchemas_1 = require("../../validation/adminSchemas");
async function registerReceiptHandler(req, res) {
    const companyId = req.user.companyId;
    const body = adminSchemas_1.registerReceiptSchema.parse(req.body);
    const result = await (0, dependencies_1.registerReceipt)({
        companyId,
        referenceType: body.referenceType,
        referenceId: body.referenceId,
        items: body.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            variant: item.variant,
            qty: item.qty,
            unitCost: item.unitCost,
        })),
    });
    if (!result.ok) {
        return res.status(400).json({ ok: false, error: result.error });
    }
    return res.status(201).json({ ok: true, movementBatchId: result.value.movementBatchId });
}
