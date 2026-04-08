"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeReverseSale = makeReverseSale;
const Result_1 = require("../types/Result");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const Quantity_1 = require("../../domain/value-objects/Quantity");
const VariantId_1 = require("../../domain/value-objects/VariantId");
const resolveInventoryMode_1 = require("../services/resolveInventoryMode");
const ensureSimpleDefaultVariant_1 = require("../services/ensureSimpleDefaultVariant");
function makeReverseSale(deps) {
    return async function reverseSale(command) {
        const existing = await deps.movementRepo.findByReference(command.companyId, 'REVERSAL', command.saleId);
        if (existing.length > 0) {
            return Result_1.Result.ok({ ok: true, movementBatchId: existing[0]?.batchId ?? command.saleId });
        }
        const now = new Date();
        const movements = [];
        const mode = await (0, resolveInventoryMode_1.resolveInventoryMode)(deps.inventorySettingsRepo, command.companyId);
        if (mode === 'SIMPLE') {
            const qtyByProduct = new Map();
            for (const item of command.items) {
                if (item.qty <= 0) {
                    return Result_1.Result.err({ type: 'InvalidQuantity', message: 'qty must be > 0' });
                }
                qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.qty);
            }
            for (const [productId, qty] of qtyByProduct.entries()) {
                const product = await deps.productRepo.getById(command.companyId, ProductId_1.ProductId.from(productId));
                if (!product) {
                    return Result_1.Result.err({ type: 'ProductNotFound', productId });
                }
                if (!product.active) {
                    return Result_1.Result.err({ type: 'InactiveProductOrVariant', productId });
                }
                const variant = await (0, ensureSimpleDefaultVariant_1.ensureSimpleDefaultVariant)(deps, { companyId: command.companyId, product });
                movements.push({
                    id: deps.idGenerator(),
                    companyId: command.companyId,
                    productId: ProductId_1.ProductId.from(productId),
                    variantId: variant.id,
                    type: 'IN',
                    qty: Quantity_1.Quantity.from(qty),
                    occurredAt: now,
                    reference: { type: 'REVERSAL', id: command.saleId },
                    batchId: command.saleId,
                    note: command.reason,
                    createdAt: now,
                });
            }
            await deps.movementRepo.addMany(movements);
            return Result_1.Result.ok({ ok: true, movementBatchId: command.saleId });
        }
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
            if (!item.variantId) {
                return Result_1.Result.err({ type: 'VariantNotFound', variantId: item.productId });
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
                type: 'IN',
                qty: Quantity_1.Quantity.from(item.qty),
                occurredAt: now,
                reference: { type: 'REVERSAL', id: command.saleId },
                batchId: command.saleId,
                note: command.reason,
                createdAt: now,
            });
        }
        await deps.movementRepo.addMany(movements);
        return Result_1.Result.ok({ ok: true, movementBatchId: command.saleId });
    };
}
