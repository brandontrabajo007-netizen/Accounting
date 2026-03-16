"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdjustmentSchema = exports.registerReceiptSchema = exports.listMovementsQuerySchema = exports.stockQuerySchema = exports.updateVariantSchema = exports.createVariantSchema = exports.updateProductSchema = exports.createProductSchema = exports.listProductsQuerySchema = exports.paginationSchema = void 0;
const zod_1 = require("zod");
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(200).default(20),
});
exports.listProductsQuerySchema = zod_1.z
    .object({
    q: zod_1.z.string().optional(),
    active: zod_1.z.coerce.boolean().optional(),
})
    .merge(exports.paginationSchema);
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    sku: zod_1.z.string().min(1),
    costUnit: zod_1.z.number().min(0),
    saleUnit: zod_1.z.number().min(0).optional(),
    active: zod_1.z.boolean(),
});
exports.updateProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    costUnit: zod_1.z.number().min(0).optional(),
    saleUnit: zod_1.z.number().min(0).optional(),
    active: zod_1.z.boolean().optional(),
});
exports.createVariantSchema = zod_1.z.object({
    attribute: zod_1.z.string().min(1),
    value: zod_1.z.string().min(1),
    skuVariant: zod_1.z.string().min(1).optional(),
    active: zod_1.z.boolean(),
});
exports.updateVariantSchema = zod_1.z.object({
    attribute: zod_1.z.string().min(1).optional(),
    value: zod_1.z.string().min(1).optional(),
    skuVariant: zod_1.z.union([zod_1.z.string().min(1), zod_1.z.null()]).optional(),
    active: zod_1.z.boolean().optional(),
});
exports.stockQuerySchema = zod_1.z.object({
    productId: zod_1.z.string().min(1).optional(),
    variantId: zod_1.z.string().min(1).optional(),
});
exports.listMovementsQuerySchema = zod_1.z
    .object({
    productId: zod_1.z.string().min(1).optional(),
    variantId: zod_1.z.string().min(1).optional(),
    type: zod_1.z.enum(['IN', 'OUT', 'ADJUST']).optional(),
    from: zod_1.z.string().datetime().optional(),
    to: zod_1.z.string().datetime().optional(),
})
    .merge(exports.paginationSchema);
exports.registerReceiptSchema = zod_1.z.object({
    referenceType: zod_1.z.enum(['purchase', 'manual']).transform((value) => (value === 'purchase' ? 'PURCHASE' : 'MANUAL')),
    referenceId: zod_1.z.string().optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        variantId: zod_1.z.string().min(1).optional(),
        variant: zod_1.z
            .object({
            attribute: zod_1.z.string().min(1),
            value: zod_1.z.string().min(1),
        })
            .optional(),
        qty: zod_1.z.number().int().positive(),
        unitCost: zod_1.z.number().min(0).optional(),
    }).refine((item) => item.variantId || item.variant, {
        message: 'variantId or variant is required',
        path: ['variantId'],
    }))
        .min(1),
});
exports.registerAdjustmentSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        variantId: zod_1.z.string().min(1),
        qtyDelta: zod_1.z.number().int().refine((value) => value !== 0, 'qtyDelta must be != 0'),
    }))
        .min(1),
});
