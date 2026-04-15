"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDeactivateProduct = makeDeactivateProduct;
const Result_1 = require("../types/Result");
const ProductId_1 = require("../../domain/value-objects/ProductId");
function makeDeactivateProduct(deps) {
    return async function deactivateProduct(command) {
        const product = await deps.productRepo.getById(command.companyId, ProductId_1.ProductId.from(command.productId));
        if (!product) {
            return Result_1.Result.err({ type: 'ProductNotFound', productId: command.productId });
        }
        await deps.productRepo.deactivate(command.companyId, ProductId_1.ProductId.from(command.productId));
        return Result_1.Result.ok({ ok: true });
    };
}
