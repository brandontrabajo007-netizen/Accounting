"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ProductSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    costUnit: { type: Number, required: true },
    active: { type: Boolean, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
}, { collection: 'inventory_products' });
ProductSchema.index({ companyId: 1, sku: 1 }, { unique: true });
exports.ProductModel = mongoose_1.default.model('InventoryProduct', ProductSchema);
