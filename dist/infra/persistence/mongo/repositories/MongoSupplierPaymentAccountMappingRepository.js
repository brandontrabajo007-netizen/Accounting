"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoSupplierPaymentAccountMappingRepository = void 0;
const supplierPaymentAccountMapping_mapper_1 = require("../mappers/supplierPaymentAccountMapping.mapper");
const supplierPaymentAccountMapping_model_1 = require("../models/supplierPaymentAccountMapping.model");
class MongoSupplierPaymentAccountMappingRepository {
    async getSupplierPaymentAccountMappingByCompanyId(companyId) {
        const doc = await supplierPaymentAccountMapping_model_1.SupplierPaymentAccountMappingModel.findOne({ companyId }).lean();
        if (!doc) {
            throw new Error(`SupplierPaymentAccountMapping not found for companyId "${companyId}"`);
        }
        return (0, supplierPaymentAccountMapping_mapper_1.mongoToSupplierPaymentAccountConfig)(doc);
    }
    async save(mapping) {
        await supplierPaymentAccountMapping_model_1.SupplierPaymentAccountMappingModel.updateOne({ companyId: mapping.companyId }, mapping, { upsert: true });
    }
}
exports.MongoSupplierPaymentAccountMappingRepository = MongoSupplierPaymentAccountMappingRepository;
