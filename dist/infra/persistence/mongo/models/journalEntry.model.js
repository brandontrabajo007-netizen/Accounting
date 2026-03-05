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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalEntryModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const MovementSchema = new mongoose_1.Schema({
    accountCode: { type: Number, required: true },
    accountName: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    group: { type: String, required: true },
}, { _id: false });
const JournalEntrySchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    companyId: { type: String, required: true, index: true },
    periodId: { type: String, index: true },
    journalNumber: { type: Number },
    date: { type: Date, required: true, index: true },
    description: { type: String, required: true },
    status: { type: String, required: true },
    movements: { type: [MovementSchema], required: true },
    eventType: { type: String },
    systemGenerated: { type: Boolean },
}, {
    timestamps: true,
    collection: 'journalentries',
});
JournalEntrySchema.plugin(mongoose_paginate_v2_1.default);
exports.JournalEntryModel = mongoose_1.default.model('JournalEntry', JournalEntrySchema);
