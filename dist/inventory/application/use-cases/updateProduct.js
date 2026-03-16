"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeUpdateProduct = makeUpdateProduct;
const Result_1 = require("../types/Result");
const ProductId_1 = require("../../domain/value-objects/ProductId");
function makeUpdateProduct(deps) {
    return async function updateProduct(command) {
        const product = await deps.productRepo.getById(command.companyId, ProductId_1.ProductId.from(command.productId));
        if (!product) {
            return Result_1.Result.err({ type: 'ProductNotFound', productId: command.productId });
        }
        if (command.costUnit !== undefined && command.costUnit < 0) {
            return Result_1.Result.err({ type: 'InvalidQuantity', message: 'costUnit must be >= 0' });
        }
        if (command.saleUnit !== undefined && command.saleUnit < 0) {
            return Result_1.Result.err({ type: 'InvalidQuantity', message: 'saleUnit must be >= 0' });
        }
        const updated = {
            ...product,
            name: command.name ?? product.name,
            costUnit: command.costUnit ?? product.costUnit,
            saleUnit: command.saleUnit ?? product.saleUnit,
            active: command.active ?? product.active,
            updatedAt: new Date(),
        };
        await deps.productRepo.update(updated);
        return Result_1.Result.ok({ product: updated });
    };
}
