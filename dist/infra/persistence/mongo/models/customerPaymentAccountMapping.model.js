"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPaymentAccountMappingModel = void 0;
const mongoose_1 = require("mongoose");
const customerPaymentAccountMappingSchema = new mongoose_1.Schema({
    companyId: { type: String, required: true, unique: true },
    cashAccount: { type: Number },
    bankAccount: { type: Number },
    accountsReceivableAccount: { type: Number, required: true },
});
exports.CustomerPaymentAccountMappingModel = (0, mongoose_1.model)('CustomerPaymentAccountMapping', customerPaymentAccountMappingSchema);
