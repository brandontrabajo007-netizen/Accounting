"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGetCustomerBalance = void 0;
const normalizeCustomerName_1 = require("../../domain/normalizeCustomerName");
const makeGetCustomerBalance = (deps) => {
    const getCustomerBalance = async (input) => {
        const normalized = (0, normalizeCustomerName_1.normalizeCustomerName)(input.customerName);
        const customer = await deps.customerRepository.findByNormalizedName(input.companyId, normalized);
        if (!customer)
            return null;
        const balance = await deps.arEntryRepository.getBalanceByCustomer(input.companyId, customer.id);
        return { customer, balance };
    };
    return { getCustomerBalance };
};
exports.makeGetCustomerBalance = makeGetCustomerBalance;
