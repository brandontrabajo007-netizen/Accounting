"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierPaymentAccountMappingModel = void 0;
const mongoose_1 = require("mongoose");
const supplierPaymentAccountMappingSchema = new mongoose_1.Schema({
    companyId: { type: String, required: true, unique: true },
    cashAccount: { type: Number },
    bankAccount: { type: Number },
    accountsPayableAccount: { type: Number, required: true },
});
exports.SupplierPaymentAccountMappingModel = (0, mongoose_1.model)('SupplierPaymentAccountMapping', supplierPaymentAccountMappingSchema);
