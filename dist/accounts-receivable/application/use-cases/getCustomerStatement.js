"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGetCustomerStatement = void 0;
const normalizeCustomerName_1 = require("../../domain/normalizeCustomerName");
const makeGetCustomerStatement = (deps) => {
    const getCustomerStatement = async (input) => {
        const normalized = (0, normalizeCustomerName_1.normalizeCustomerName)(input.customerName);
        const customer = await deps.customerRepository.findByNormalizedName(input.companyId, normalized);
        if (!customer)
            return null;
        const [historyEntries, balance] = await Promise.all([
            deps.customerHistoryRepository.listByCustomer(input.companyId, customer.id),
            deps.arEntryRepository.getBalanceByCustomer(input.companyId, customer.id),
        ]);
        return { customer, balance, entries: historyEntries.items };
    };
    return { getCustomerStatement };
};
exports.makeGetCustomerStatement = makeGetCustomerStatement;
