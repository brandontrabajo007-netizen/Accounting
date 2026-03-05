"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGetSupplierStatement = void 0;
const normalizeSupplierName_1 = require("../../domain/normalizeSupplierName");
const makeGetSupplierStatement = (deps) => {
    const getSupplierStatement = async (input) => {
        const normalized = (0, normalizeSupplierName_1.normalizeSupplierName)(input.supplierName);
        const supplier = await deps.supplierRepository.findByNormalizedName(input.companyId, normalized);
        if (!supplier)
            return null;
        const [historyEntries, balance] = await Promise.all([
            deps.supplierHistoryRepository.listBySupplier(input.companyId, supplier.id),
            deps.apEntryRepository.getBalanceBySupplier(input.companyId, supplier.id),
        ]);
        return { supplier, balance, entries: historyEntries.items };
    };
    return { getSupplierStatement };
};
exports.makeGetSupplierStatement = makeGetSupplierStatement;
