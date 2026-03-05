"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCostFixed = computeCostFixed;
function computeCostFixed(product, qty) {
    return product.costUnit * qty;
}
