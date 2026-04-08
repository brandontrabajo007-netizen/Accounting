"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const VariantSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    attribute: { type: String, required: true },
    value: { type: String, required: true },
    skuVariant: { type: String, required: false },
    systemType: { type: String, enum: ['SIMPLE_DEFAULT'], required: false, index: true },
    active: { type: Boolean, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
}, { collection: 'inventory_variants' });
VariantSchema.index({ companyId: 1, productId: 1, attribute: 1, value: 1, active: 1 }, { unique: true });
exports.VariantModel = mongoose_1.default.model('InventoryVariant', VariantSchema);
