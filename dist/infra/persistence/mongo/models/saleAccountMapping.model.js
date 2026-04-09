"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleAccountMappingModel = void 0;
const mongoose_1 = require("mongoose");
// 1️ Define primero el schema
const saleAccountMappingSchema = new mongoose_1.Schema({
    companyId: { type: String, required: true, unique: true },
    cashAccount: { type: Number, required: true },
    bankAccount: { type: Number },
    incomeAccount: { type: Number, required: true },
    vatAccount: { type: Number },
    cogsAccount: { type: Number },
    inventoryAccount: { type: Number },
    accountsReceivableAccount: { type: Number },
});
// 3️ Crea el modelo con ese tipo
exports.SaleAccountMappingModel = (0, mongoose_1.model)('SaleAccountMapping', saleAccountMappingSchema);
