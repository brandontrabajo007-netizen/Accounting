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
exports.ArEntryMongoModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ArEntrySchema = new mongoose_1.Schema({
    companyId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['debit', 'credit'] },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    source: {
        kind: { type: String, required: true, enum: ['sale', 'payment', 'manual'] },
        referenceId: { type: String },
        note: { type: String },
    },
}, { timestamps: true });
ArEntrySchema.index({ companyId: 1, customerId: 1, date: 1 });
exports.ArEntryMongoModel = mongoose_1.default.models.ArEntry ?? mongoose_1.default.model('ArEntry', ArEntrySchema);
