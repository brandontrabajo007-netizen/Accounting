"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCustomer = void 0;
const normalizeCustomerName_1 = require("../../domain/normalizeCustomerName");
const ensureCustomer = async (customerRepository, companyId, name) => {
    const normalizedName = (0, normalizeCustomerName_1.normalizeCustomerName)(name);
    const existing = await customerRepository.findByNormalizedName(companyId, normalizedName);
    if (existing)
        return existing;
    return customerRepository.create({
        companyId,
        name: name.trim(),
        normalizedName,
    });
};
exports.ensureCustomer = ensureCustomer;
