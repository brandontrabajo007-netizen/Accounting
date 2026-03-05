"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovementModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MovementSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    variantId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    qty: { type: Number, required: false },
    qtyDelta: { type: Number, required: false },
    occurredAt: { type: Date, required: true },
    reference: {
        type: { type: String, required: true },
        id: { type: String, required: true },
    },
    batchId: { type: String, required: true, index: true },
    note: { type: String, required: false },
    createdAt: { type: Date, required: true },
}, { collection: 'inventory_movements' });
MovementSchema.index({ companyId: 1, 'reference.type': 1, 'reference.id': 1, productId: 1, variantId: 1 }, { unique: true });
exports.MovementModel = mongoose_1.default.model('InventoryMovement', MovementSchema);
