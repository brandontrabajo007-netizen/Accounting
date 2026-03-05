"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterSupplierDebt = void 0;
const ensureSupplier_1 = require("../services/ensureSupplier");
const makeRegisterSupplierDebt = (deps) => {
    const registerSupplierDebt = async (input) => {
        if (!input.supplierName?.trim())
            return null;
        if (!Number.isFinite(input.amount) || input.amount <= 0)
            return null;
        const supplier = await (0, ensureSupplier_1.ensureSupplier)(deps.supplierRepository, input.companyId, input.supplierName);
        return deps.apEntryRepository.add({
            companyId: input.companyId,
            supplierId: supplier.id,
            type: 'credit',
            amount: input.amount,
            date: input.date ?? new Date(),
            source: {
                kind: 'purchase',
                referenceId: input.source.referenceId,
                note: input.source.note,
            },
        });
    };
    return { registerSupplierDebt };
};
exports.makeRegisterSupplierDebt = makeRegisterSupplierDebt;
