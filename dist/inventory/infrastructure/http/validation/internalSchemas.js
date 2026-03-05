"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalReverseSchema = exports.internalConfirmSchema = exports.internalCostSchema = void 0;
const zod_1 = require("zod");
exports.internalCostSchema = zod_1.z.object({
    companyId: zod_1.z.string().min(1),
    saleId: zod_1.z.string().min(1),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        variantId: zod_1.z.string().min(1),
        qty: zod_1.z.number().int().positive(),
    }))
        .min(1),
});
exports.internalConfirmSchema = zod_1.z.object({
    companyId: zod_1.z.string().min(1),
    saleId: zod_1.z.string().min(1),
    reference: zod_1.z.string().min(1),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        variantId: zod_1.z.string().min(1),
        qty: zod_1.z.number().int().positive(),
    }))
        .min(1),
});
exports.internalReverseSchema = zod_1.z.object({
    companyId: zod_1.z.string().min(1),
    saleId: zod_1.z.string().min(1),
    reason: zod_1.z.string().min(1),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        variantId: zod_1.z.string().min(1),
        qty: zod_1.z.number().int().positive(),
    }))
        .min(1),
});
