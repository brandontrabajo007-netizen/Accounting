"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventorySettingsModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const InventorySettingsSchema = new mongoose_1.default.Schema({
    companyId: { type: String, required: true, unique: true, index: true },
    mode: { type: String, enum: ['SIMPLE', 'VARIANT'], required: true, default: 'VARIANT' },
    createdAt: { type: Date, required: true, default: () => new Date() },
    updatedAt: { type: Date, required: true, default: () => new Date() },
}, { collection: 'inventory_settings' });
InventorySettingsSchema.index({ companyId: 1 }, { unique: true });
exports.InventorySettingsModel = mongoose_1.default.model('InventorySettings', InventorySettingsSchema);
