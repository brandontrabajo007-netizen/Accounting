"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoPayrollAccountMappingRepository = void 0;
const payrollAccountMapping_mapper_1 = require("../mappers/payrollAccountMapping.mapper");
const PayrollAccountMapping_model_1 = require("../models/PayrollAccountMapping.model");
class MongoPayrollAccountMappingRepository {
    async getPayrollAccountMappingByCompanyId(companyId) {
        const doc = await PayrollAccountMapping_model_1.PayrollAccountMappingModel.findOne({ companyId });
        if (!doc) {
            throw new Error(`❌ PayrollAccountMapping no encontrado para companyId: ${companyId}`);
        }
        return (0, payrollAccountMapping_mapper_1.toPayrollAccountConfig)(doc);
    }
}
exports.MongoPayrollAccountMappingRepository = MongoPayrollAccountMappingRepository;
