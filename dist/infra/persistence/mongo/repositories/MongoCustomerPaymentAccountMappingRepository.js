"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoCustomerPaymentAccountMappingRepository = void 0;
const customerPaymentAccountMapping_mapper_1 = require("../mappers/customerPaymentAccountMapping.mapper");
const customerPaymentAccountMapping_model_1 = require("../models/customerPaymentAccountMapping.model");
class MongoCustomerPaymentAccountMappingRepository {
    async getCustomerPaymentAccountMappingByCompanyId(companyId) {
        const doc = await customerPaymentAccountMapping_model_1.CustomerPaymentAccountMappingModel.findOne({ companyId }).lean();
        if (!doc) {
            throw new Error(`CustomerPaymentAccountMapping not found for companyId "${companyId}"`);
        }
        return (0, customerPaymentAccountMapping_mapper_1.mongoToCustomerPaymentAccountConfig)(doc);
    }
    async save(mapping) {
        await customerPaymentAccountMapping_model_1.CustomerPaymentAccountMappingModel.updateOne({ companyId: mapping.companyId }, mapping, { upsert: true });
    }
}
exports.MongoCustomerPaymentAccountMappingRepository = MongoCustomerPaymentAccountMappingRepository;
