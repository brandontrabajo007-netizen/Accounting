"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCreateVariant = makeCreateVariant;
const Result_1 = require("../types/Result");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const Sku_1 = require("../../domain/value-objects/Sku");
const VariantId_1 = require("../../domain/value-objects/VariantId");
function makeCreateVariant(deps) {
    return async function createVariant(command) {
        const product = await deps.productRepo.getById(command.companyId, ProductId_1.ProductId.from(command.productId));
        if (!product) {
            return Result_1.Result.err({ type: 'ProductNotFound', productId: command.productId });
        }
        if (!product.active) {
            return Result_1.Result.err({ type: 'InactiveProductOrVariant', productId: command.productId });
        }
        const now = new Date();
        const variant = {
            id: VariantId_1.VariantId.from(deps.idGenerator()),
            companyId: command.companyId,
            productId: product.id,
            attribute: command.attribute,
            value: command.value,
            skuVariant: command.skuVariant ? Sku_1.Sku.from(command.skuVariant) : undefined,
            active: command.active,
            createdAt: now,
            updatedAt: now,
        };
        await deps.variantRepo.create(variant);
        return Result_1.Result.ok({ variantId: variant.id });
    };
}
