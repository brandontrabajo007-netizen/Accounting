"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeValidateSaleCart = makeValidateSaleCart;
const Result_1 = require("../types/Result");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const VariantId_1 = require("../../domain/value-objects/VariantId");
const computeAvailableStock_1 = require("../../domain/services/computeAvailableStock");
const resolveInventoryMode_1 = require("../services/resolveInventoryMode");
function makeValidateSaleCart(deps) {
    return async function validateSaleCart(command) {
        const issues = [];
        const mode = await (0, resolveInventoryMode_1.resolveInventoryMode)(deps.inventorySettingsRepo, command.companyId);
        if (mode === 'SIMPLE') {
            const requestedByProduct = new Map();
            for (const item of command.items) {
                const current = requestedByProduct.get(item.productId) ?? 0;
                requestedByProduct.set(item.productId, current + item.qty);
            }
            for (const [productId, requestedQty] of requestedByProduct.entries()) {
                const product = await deps.productRepo.getById(command.companyId, ProductId_1.ProductId.from(productId));
                if (!product) {
                    issues.push({ productId, variantId: productId, reason: 'NOT_FOUND' });
                    continue;
                }
                if (!product.active) {
                    issues.push({ productId, variantId: productId, reason: 'INACTIVE' });
                    continue;
                }
                const movements = await deps.movementRepo.listByProduct(command.companyId, product.id);
                const reservedActiveQty = deps.reservationRepo
                    ? await deps.reservationRepo.listActiveQtyByProduct(command.companyId, product.id)
                    : 0;
                const stock = (0, computeAvailableStock_1.computeAvailableStock)(movements, reservedActiveQty);
                if (stock.availableQty < requestedQty) {
                    issues.push({
                        productId,
                        variantId: productId,
                        reason: 'INSUFFICIENT_STOCK',
                        availableQty: stock.availableQty,
                    });
                }
            }
            return Result_1.Result.ok({ ok: issues.length === 0, issues });
        }
        for (const item of command.items) {
            const product = await deps.productRepo.getById(command.companyId, ProductId_1.ProductId.from(item.productId));
            if (!product) {
                issues.push({ productId: item.productId, variantId: item.variantId ?? item.productId, reason: 'NOT_FOUND' });
                continue;
            }
            if (!product.active) {
                issues.push({ productId: item.productId, variantId: item.variantId ?? item.productId, reason: 'INACTIVE' });
                continue;
            }
            if (!item.variantId) {
                issues.push({ productId: item.productId, variantId: item.productId, reason: 'NOT_FOUND' });
                continue;
            }
            const variant = await deps.variantRepo.getById(command.companyId, VariantId_1.VariantId.from(item.variantId));
            if (!variant) {
                issues.push({ productId: item.productId, variantId: item.variantId, reason: 'NOT_FOUND' });
                continue;
            }
            if (!variant.active) {
                issues.push({ productId: item.productId, variantId: item.variantId, reason: 'INACTIVE' });
                continue;
            }
            const movements = await deps.movementRepo.listByProductAndVariant(command.companyId, product.id, variant.id);
            const reservedActiveQty = deps.reservationRepo
                ? await deps.reservationRepo.listActiveQtyByVariant(command.companyId, VariantId_1.VariantId.from(item.variantId))
                : 0;
            const stock = (0, computeAvailableStock_1.computeAvailableStock)(movements, reservedActiveQty);
            if (stock.availableQty < item.qty) {
                issues.push({
                    productId: item.productId,
                    variantId: item.variantId,
                    reason: 'INSUFFICIENT_STOCK',
                    availableQty: stock.availableQty,
                });
            }
        }
        return Result_1.Result.ok({ ok: issues.length === 0, issues });
    };
}
