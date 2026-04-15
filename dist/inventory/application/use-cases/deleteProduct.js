"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDeleteProduct = makeDeleteProduct;
const Result_1 = require("../types/Result");
const ProductId_1 = require("../../domain/value-objects/ProductId");
function makeDeleteProduct(deps) {
    return async function deleteProduct(command) {
        const productId = ProductId_1.ProductId.from(command.productId);
        const product = await deps.productRepo.getById(command.companyId, productId);
        if (!product) {
            return Result_1.Result.err({ type: 'ProductNotFound', productId: command.productId });
        }
        const reservedQty = await deps.reservationRepo.listActiveQtyByProduct(command.companyId, productId);
        if (reservedQty > 0) {
            return Result_1.Result.err({ type: 'ProductHasActiveReservations', productId: command.productId });
        }
        await deps.movementRepo.stampDeletedProductSnapshot(command.companyId, productId, {
            name: product.name,
            sku: product.sku,
        });
        const variants = await deps.variantRepo.listByProductId(command.companyId, productId);
        for (const variant of variants) {
            await deps.variantRepo.delete(command.companyId, variant.id);
        }
        await deps.productRepo.delete(command.companyId, productId);
        return Result_1.Result.ok({ ok: true });
    };
}
