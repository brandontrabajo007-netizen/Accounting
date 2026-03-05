"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGetSaleCost = makeGetSaleCost;
const Result_1 = require("../types/Result");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const Quantity_1 = require("../../domain/value-objects/Quantity");
const computeCostFixed_1 = require("../../domain/services/computeCostFixed");
function makeGetSaleCost(deps) {
    return async function getSaleCost(command) {
        const aggregated = new Map();
        for (const item of command.items) {
            if (item.qty <= 0) {
                return Result_1.Result.err({ type: 'InvalidQuantity', message: 'qty must be > 0' });
            }
            const current = aggregated.get(item.productId) ?? 0;
            aggregated.set(item.productId, current + item.qty);
        }
        const breakdown = [];
        let totalAmount = 0;
        for (const [productId, qty] of aggregated.entries()) {
            const product = await deps.productRepo.getById(command.companyId, ProductId_1.ProductId.from(productId));
            if (!product) {
                return Result_1.Result.err({ type: 'ProductNotFound', productId });
            }
            const cost = (0, computeCostFixed_1.computeCostFixed)(product, Quantity_1.Quantity.from(qty));
            totalAmount += cost;
            breakdown.push({
                productId,
                qty,
                unitCost: product.costUnit,
                lineCost: cost,
            });
        }
        return Result_1.Result.ok({
            saleId: command.saleId,
            costTotal: totalAmount,
            breakdown,
        });
    };
}
