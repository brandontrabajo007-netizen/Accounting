"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollAccountMappingModel = void 0;
const mongoose_1 = require("mongoose");
const PayrollAccountMappingSchema = new mongoose_1.Schema({
    companyId: { type: String, required: true, unique: true },
    expenseAccount: { type: Number, required: true },
    cashAccount: { type: Number, required: true },
    bankAccount: { type: Number, required: true },
});
exports.PayrollAccountMappingModel = (0, mongoose_1.model)('PayrollAccountMapping', PayrollAccountMappingSchema);
