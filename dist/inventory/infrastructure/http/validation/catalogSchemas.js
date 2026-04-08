"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelReservationSchema = exports.createReservationSchema = exports.validateSaleSchema = exports.catalogCompanyQuerySchema = exports.catalogListQuerySchema = void 0;
const zod_1 = require("zod");
exports.catalogListQuerySchema = zod_1.z.object({
    companyId: zod_1.z.string().min(1),
    q: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(200).default(20),
});
exports.catalogCompanyQuerySchema = zod_1.z.object({
    companyId: zod_1.z.string().min(1),
});
exports.validateSaleSchema = zod_1.z.object({
    companyId: zod_1.z.string().min(1),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        variantId: zod_1.z.string().min(1).optional(),
        qty: zod_1.z.number().int().positive(),
    }))
        .min(1),
});
exports.createReservationSchema = zod_1.z.object({
    companyId: zod_1.z.string().min(1),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        variantId: zod_1.z.string().min(1).optional(),
        qty: zod_1.z.number().int().positive(),
    }))
        .min(1),
    ttlMinutes: zod_1.z.number().int().min(1).max(1440),
});
exports.cancelReservationSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1),
});
