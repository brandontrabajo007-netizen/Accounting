"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ReservationSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    items: [
        {
            productId: { type: String, required: true },
            variantId: { type: String, required: true },
            qty: { type: Number, required: true },
        },
    ],
    status: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
}, { collection: 'inventory_reservations' });
ReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.ReservationModel = mongoose_1.default.model('InventoryReservation', ReservationSchema);
