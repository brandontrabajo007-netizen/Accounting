"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCreateProduct = makeCreateProduct;
const Result_1 = require("../types/Result");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const Sku_1 = require("../../domain/value-objects/Sku");
function makeCreateProduct(deps) {
    return async function createProduct(command) {
        if (command.costUnit < 0) {
            return Result_1.Result.err({ type: 'InvalidQuantity', message: 'costUnit must be >= 0' });
        }
        const existing = await deps.productRepo.getBySku(command.companyId, Sku_1.Sku.from(command.sku));
        if (existing) {
            return Result_1.Result.err({ type: 'DuplicateSku', sku: command.sku });
        }
        const now = new Date();
        const product = {
            id: ProductId_1.ProductId.from(deps.idGenerator()),
            companyId: command.companyId,
            name: command.name,
            sku: Sku_1.Sku.from(command.sku),
            costUnit: command.costUnit,
            active: command.active,
            createdAt: now,
            updatedAt: now,
        };
        await deps.productRepo.create(product);
        return Result_1.Result.ok({ productId: product.id });
    };
}
