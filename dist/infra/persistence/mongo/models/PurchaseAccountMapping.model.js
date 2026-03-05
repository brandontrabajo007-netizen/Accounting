"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseAccountMappingModel = void 0;
const mongoose_1 = require("mongoose");
const purchaseAccountMappingSchema = new mongoose_1.Schema({
    companyId: { type: String, required: true, unique: true },
    vatAccount: { type: Number },
    cashAccount: { type: Number },
    bankAccount: { type: Number },
    accountsPayableAccount: { type: Number, required: true },
}, { timestamps: true });
exports.PurchaseAccountMappingModel = (0, mongoose_1.model)('PurchaseAccountMapping', purchaseAccountMappingSchema);
