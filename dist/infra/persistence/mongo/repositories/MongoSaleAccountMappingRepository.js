"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoSaleAccountMappingRepository = void 0;
const saleAccountMapping_mapper_1 = require("../mappers/saleAccountMapping.mapper");
const saleAccountMapping_model_1 = require("../models/saleAccountMapping.model");
class MongoSaleAccountMappingRepository {
    async getSaleAccountMappingByCompanyId(companyId) {
        const doc = await saleAccountMapping_model_1.SaleAccountMappingModel.findOne({ companyId }).lean();
        if (!doc) {
            throw new Error(`SaleAccountMapping not found for companyId "${companyId}"`);
        }
        return (0, saleAccountMapping_mapper_1.mongoToSaleAccountConfig)(doc);
    }
    async save(mapping) {
        await saleAccountMapping_model_1.SaleAccountMappingModel.updateOne({ companyId: mapping.companyId }, mapping, { upsert: true });
    }
}
exports.MongoSaleAccountMappingRepository = MongoSaleAccountMappingRepository;
