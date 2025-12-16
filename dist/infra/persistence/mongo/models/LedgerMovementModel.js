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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerMovementMongoModel = void 0;
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const mongoose_1 = __importStar(require("mongoose"));
const LedgerMovementSchema = new mongoose_1.Schema({
    accountCode: { type: Number, required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    date: { type: Date, required: true },
    journalEntryId: { type: String, required: true },
    description: { type: String, required: true },
    companyId: { type: String, required: true },
    status: { type: String, enum: Object.values(MovementStatus_1.MovementStatus), default: MovementStatus_1.MovementStatus.PROCESSED },
}, { timestamps: true });
exports.LedgerMovementMongoModel = mongoose_1.default.models.LedgerMovement ?? mongoose_1.default.model('LedgerMovement', LedgerMovementSchema);
