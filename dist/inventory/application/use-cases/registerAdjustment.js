"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterAdjustment = makeRegisterAdjustment;
const Result_1 = require("../types/Result");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const VariantId_1 = require("../../domain/value-objects/VariantId");
function makeRegisterAdjustment(deps) {
    return async function registerAdjustment(command) {
        const batchId = deps.idGenerator();
        const now = new Date();
        const movements = [];
        for (const item of command.items) {
            if (item.qtyDelta === 0) {
                return Result_1.Result.err({ type: 'InvalidQuantity', message: 'qtyDelta must be != 0' });
            }
            const product = await deps.productRepo.getById(command.companyId, ProductId_1.ProductId.from(item.productId));
            if (!product) {
                return Result_1.Result.err({ type: 'ProductNotFound', productId: item.productId });
            }
            if (!product.active) {
                return Result_1.Result.err({ type: 'InactiveProductOrVariant', productId: item.productId });
            }
            const variant = await deps.variantRepo.getById(command.companyId, VariantId_1.VariantId.from(item.variantId));
            if (!variant) {
                return Result_1.Result.err({ type: 'VariantNotFound', variantId: item.variantId });
            }
            if (!variant.active) {
                return Result_1.Result.err({ type: 'InactiveProductOrVariant', productId: item.productId, variantId: item.variantId });
            }
            movements.push({
                id: deps.idGenerator(),
                companyId: command.companyId,
                productId: ProductId_1.ProductId.from(item.productId),
                variantId: VariantId_1.VariantId.from(item.variantId),
                type: 'ADJUST',
                qtyDelta: item.qtyDelta,
                occurredAt: now,
                reference: { type: 'ADJUSTMENT', id: batchId },
                batchId,
                note: command.reason,
                createdAt: now,
            });
        }
        await deps.movementRepo.addMany(movements);
        return Result_1.Result.ok({ movementBatchId: batchId });
    };
}
