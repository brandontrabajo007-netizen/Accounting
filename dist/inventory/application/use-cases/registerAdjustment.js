"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterAdjustment = makeRegisterAdjustment;
const Result_1 = require("../types/Result");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const VariantId_1 = require("../../domain/value-objects/VariantId");
const resolveInventoryMode_1 = require("../services/resolveInventoryMode");
const ensureSimpleDefaultVariant_1 = require("../services/ensureSimpleDefaultVariant");
function makeRegisterAdjustment(deps) {
    return async function registerAdjustment(command) {
        const batchId = deps.idGenerator();
        const now = new Date();
        const movements = [];
        const mode = await (0, resolveInventoryMode_1.resolveInventoryMode)(deps.inventorySettingsRepo, command.companyId);
        const aggregated = new Map();
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
            const variant = mode === 'SIMPLE'
                ? await (0, ensureSimpleDefaultVariant_1.ensureSimpleDefaultVariant)(deps, { companyId: command.companyId, product })
                : item.variantId
                    ? await deps.variantRepo.getById(command.companyId, VariantId_1.VariantId.from(item.variantId))
                    : null;
            if (!variant) {
                return Result_1.Result.err({ type: 'VariantNotFound', variantId: item.variantId ?? item.productId });
            }
            if (!variant.active) {
                return Result_1.Result.err({ type: 'InactiveProductOrVariant', productId: item.productId, variantId: variant.id });
            }
            const key = `${item.productId}|${variant.id}`;
            const current = aggregated.get(key);
            if (current) {
                current.qtyDelta += item.qtyDelta;
            }
            else {
                aggregated.set(key, {
                    productId: item.productId,
                    variantId: variant.id,
                    qtyDelta: item.qtyDelta,
                });
            }
        }
        for (const entry of aggregated.values()) {
            if (entry.qtyDelta === 0) {
                continue;
            }
            movements.push({
                id: deps.idGenerator(),
                companyId: command.companyId,
                productId: ProductId_1.ProductId.from(entry.productId),
                variantId: VariantId_1.VariantId.from(entry.variantId),
                type: 'ADJUST',
                qtyDelta: entry.qtyDelta,
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
