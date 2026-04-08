"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./entities/Product"), exports);
__exportStar(require("./entities/Variant"), exports);
__exportStar(require("./entities/InventoryMovement"), exports);
__exportStar(require("./entities/Reservation"), exports);
__exportStar(require("./entities/InventorySettings"), exports);
__exportStar(require("./value-objects/ProductId"), exports);
__exportStar(require("./value-objects/VariantId"), exports);
__exportStar(require("./value-objects/Quantity"), exports);
__exportStar(require("./value-objects/Sku"), exports);
__exportStar(require("./errors/ProductNotFound"), exports);
__exportStar(require("./errors/VariantNotFound"), exports);
__exportStar(require("./errors/InsufficientStock"), exports);
__exportStar(require("./errors/InvalidQuantity"), exports);
__exportStar(require("./errors/InactiveProductOrVariant"), exports);
__exportStar(require("./errors/DuplicateSku"), exports);
__exportStar(require("./errors/InventoryModeViolation"), exports);
__exportStar(require("./services/computeAvailableStock"), exports);
__exportStar(require("./services/computeCostFixed"), exports);
