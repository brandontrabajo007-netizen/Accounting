"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSupplier = void 0;
const normalizeSupplierName_1 = require("../../domain/normalizeSupplierName");
const ensureSupplier = async (supplierRepository, companyId, name) => {
    const normalizedName = (0, normalizeSupplierName_1.normalizeSupplierName)(name);
    const existing = await supplierRepository.findByNormalizedName(companyId, normalizedName);
    if (existing)
        return existing;
    return supplierRepository.create({
        companyId,
        name: name.trim(),
        normalizedName,
    });
};
exports.ensureSupplier = ensureSupplier;
