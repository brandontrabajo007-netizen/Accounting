"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGetSupplierBalance = void 0;
const normalizeSupplierName_1 = require("../../domain/normalizeSupplierName");
const makeGetSupplierBalance = (deps) => {
    const getSupplierBalance = async (input) => {
        const normalized = (0, normalizeSupplierName_1.normalizeSupplierName)(input.supplierName);
        const supplier = await deps.supplierRepository.findByNormalizedName(input.companyId, normalized);
        if (!supplier)
            return null;
        const balance = await deps.apEntryRepository.getBalanceBySupplier(input.companyId, supplier.id);
        return { supplier, balance };
    };
    return { getSupplierBalance };
};
exports.makeGetSupplierBalance = makeGetSupplierBalance;
