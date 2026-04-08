"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterReceipt = makeRegisterReceipt;
const Result_1 = require("../types/Result");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const Quantity_1 = require("../../domain/value-objects/Quantity");
const VariantId_1 = require("../../domain/value-objects/VariantId");
const resolveInventoryMode_1 = require("../services/resolveInventoryMode");
const ensureSimpleDefaultVariant_1 = require("../services/ensureSimpleDefaultVariant");
function makeRegisterReceipt(deps) {
    return async function registerReceipt(command) {
        const batchId = deps.idGenerator();
        const now = new Date();
        const movements = [];
        const mode = await (0, resolveInventoryMode_1.resolveInventoryMode)(deps.inventorySettingsRepo, command.companyId);
        const aggregated = new Map();
        for (const item of command.items) {
            if (item.qty <= 0) {
                return Result_1.Result.err({ type: 'InvalidQuantity', message: 'qty must be > 0' });
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
                    : item.variant
                        ? await deps.variantRepo.getByProductAndAttributeValue(command.companyId, ProductId_1.ProductId.from(item.productId), item.variant.attribute, item.variant.value)
                        : null;
            if (!variant) {
                return Result_1.Result.err({ type: 'VariantNotFound', variantId: item.variantId ?? item.variant?.value ?? '' });
            }
            if (!variant.active) {
                return Result_1.Result.err({ type: 'InactiveProductOrVariant', productId: item.productId, variantId: variant.id });
            }
            const key = `${item.productId}|${variant.id}`;
            const current = aggregated.get(key);
            if (current) {
                current.qty += item.qty;
            }
            else {
                aggregated.set(key, {
                    productId: item.productId,
                    variantId: variant.id,
                    qty: item.qty,
                });
            }
        }
        for (const entry of aggregated.values()) {
            movements.push({
                id: deps.idGenerator(),
                companyId: command.companyId,
                productId: ProductId_1.ProductId.from(entry.productId),
                variantId: VariantId_1.VariantId.from(entry.variantId),
                type: 'IN',
                qty: Quantity_1.Quantity.from(entry.qty),
                occurredAt: now,
                reference: { type: command.referenceType, id: command.referenceId ?? batchId },
                batchId,
                createdAt: now,
            });
        }
        await deps.movementRepo.addMany(movements);
        return Result_1.Result.ok({ movementBatchId: batchId });
    };
}
