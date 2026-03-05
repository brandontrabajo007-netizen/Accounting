"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoPurchaseAccountMappingRepository = void 0;
const purchaseAccountMapping_mapper_1 = require("../mappers/purchaseAccountMapping.mapper");
const PurchaseAccountMapping_model_1 = require("../models/PurchaseAccountMapping.model");
class MongoPurchaseAccountMappingRepository {
    async getPurchaseAccountMappingByCompanyId(companyId) {
        const doc = await PurchaseAccountMapping_model_1.PurchaseAccountMappingModel.findOne({ companyId }).lean();
        if (!doc) {
            throw new Error(`No purchase account mapping found for company ${companyId}`);
        }
        // doc ya es compatible con PurchaseAccountMappingDocument por el modelo tipado
        return (0, purchaseAccountMapping_mapper_1.toPurchaseAccountConfig)(doc);
    }
}
exports.MongoPurchaseAccountMappingRepository = MongoPurchaseAccountMappingRepository;
