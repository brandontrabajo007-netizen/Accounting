"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeConfirmSale = makeConfirmSale;
const Result_1 = require("../types/Result");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const Quantity_1 = require("../../domain/value-objects/Quantity");
const VariantId_1 = require("../../domain/value-objects/VariantId");
const computeAvailableStock_1 = require("../../domain/services/computeAvailableStock");
const getSaleCost_1 = require("./getSaleCost");
const resolveInventoryMode_1 = require("../services/resolveInventoryMode");
const ensureSimpleDefaultVariant_1 = require("../services/ensureSimpleDefaultVariant");
function makeConfirmSale(deps) {
    const getSaleCost = (0, getSaleCost_1.makeGetSaleCost)({ productRepo: deps.productRepo });
    return async function confirmSale(command) {
        const existing = await deps.movementRepo.findByReference(command.companyId, 'SALE', command.saleId);
        if (existing.length > 0) {
            const costResult = await getSaleCost({
                companyId: command.companyId,
                saleId: command.saleId,
                items: command.items,
            });
            if (!costResult.ok) {
                return costResult;
            }
            return Result_1.Result.ok({
                ok: true,
                movementBatchId: existing[0]?.batchId ?? command.saleId,
                costTotal: costResult.value.costTotal,
            });
        }
        const now = new Date();
        const movements = [];
        const mode = await (0, resolveInventoryMode_1.resolveInventoryMode)(deps.inventorySettingsRepo, command.companyId);
        if (mode === 'SIMPLE') {
            const requestedByProduct = new Map();
            for (const item of command.items) {
                if (item.qty <= 0) {
                    return Result_1.Result.err({ type: 'InvalidQuantity', message: 'qty must be > 0' });
                }
                const current = requestedByProduct.get(item.productId) ?? 0;
                requestedByProduct.set(item.productId, current + item.qty);
            }
            for (const [productId, qty] of requestedByProduct.entries()) {
                const product = await deps.productRepo.getById(command.companyId, ProductId_1.ProductId.from(productId));
                if (!product) {
                    return Result_1.Result.err({ type: 'ProductNotFound', productId });
                }
                if (!product.active) {
                    return Result_1.Result.err({ type: 'InactiveProductOrVariant', productId });
                }
                const variant = await (0, ensureSimpleDefaultVariant_1.ensureSimpleDefaultVariant)(deps, { companyId: command.companyId, product });
                const movementsForProduct = await deps.movementRepo.listByProduct(command.companyId, product.id);
                const reservedActiveQty = deps.reservationRepo && !command.ignoreActiveReservations
                    ? await deps.reservationRepo.listActiveQtyByProduct(command.companyId, product.id)
                    : 0;
                const stock = (0, computeAvailableStock_1.computeAvailableStock)(movementsForProduct, reservedActiveQty);
                if (stock.availableQty < qty) {
                    return Result_1.Result.err({
                        type: 'InsufficientStock',
                        productId,
                        variantId: variant.id,
                        availableQty: stock.availableQty,
                        requestedQty: qty,
                    });
                }
                movements.push({
                    id: deps.idGenerator(),
                    companyId: command.companyId,
                    productId: ProductId_1.ProductId.from(productId),
                    variantId: variant.id,
                    type: 'OUT',
                    qty: Quantity_1.Quantity.from(qty),
                    occurredAt: now,
                    reference: { type: 'SALE', id: command.saleId },
                    batchId: command.saleId,
                    note: command.reference,
                    createdAt: now,
                });
            }
            await deps.movementRepo.addMany(movements);
            const costResult = await getSaleCost({
                companyId: command.companyId,
                saleId: command.saleId,
                items: command.items,
            });
            if (!costResult.ok) {
                return costResult;
            }
            return Result_1.Result.ok({
                ok: true,
                movementBatchId: command.saleId,
                costTotal: costResult.value.costTotal,
            });
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
            const movementsForVariant = await deps.movementRepo.listByProductAndVariant(command.companyId, product.id, variant.id);
            const reservedActiveQty = deps.reservationRepo && !command.ignoreActiveReservations
                ? await deps.reservationRepo.listActiveQtyByVariant(command.companyId, VariantId_1.VariantId.from(item.variantId))
                : 0;
            const stock = (0, computeAvailableStock_1.computeAvailableStock)(movementsForVariant, reservedActiveQty);
            if (stock.availableQty < item.qty) {
                return Result_1.Result.err({
                    type: 'InsufficientStock',
                    productId: item.productId,
                    variantId: item.variantId,
                    availableQty: stock.availableQty,
                    requestedQty: item.qty,
                });
            }
            movements.push({
                id: deps.idGenerator(),
                companyId: command.companyId,
                productId: ProductId_1.ProductId.from(item.productId),
                variantId: VariantId_1.VariantId.from(item.variantId),
                type: 'OUT',
                qty: Quantity_1.Quantity.from(item.qty),
                occurredAt: now,
                reference: { type: 'SALE', id: command.saleId },
                batchId: command.saleId,
                note: command.reference,
                createdAt: now,
            });
        }
        await deps.movementRepo.addMany(movements);
        const costResult = await getSaleCost({
            companyId: command.companyId,
            saleId: command.saleId,
            items: command.items,
        });
        if (!costResult.ok) {
            return costResult;
        }
        return Result_1.Result.ok({
            ok: true,
            movementBatchId: command.saleId,
            costTotal: costResult.value.costTotal,
        });
    };
}
