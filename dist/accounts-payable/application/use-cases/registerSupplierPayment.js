"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterSupplierPayment = void 0;
const ensureSupplier_1 = require("../services/ensureSupplier");
const makeRegisterSupplierPayment = (deps) => {
    const registerSupplierPayment = async (input) => {
        if (!input.supplierName?.trim())
            return null;
        if (!Number.isFinite(input.amount) || input.amount <= 0)
            return null;
        const supplier = await (0, ensureSupplier_1.ensureSupplier)(deps.supplierRepository, input.companyId, input.supplierName);
        return deps.apEntryRepository.add({
            companyId: input.companyId,
            supplierId: supplier.id,
            type: 'debit',
            amount: input.amount,
            date: input.date ?? new Date(),
            source: {
                kind: 'payment',
                note: input.source?.note,
                referenceId: input.source?.referenceId,
            },
        });
    };
    return { registerSupplierPayment };
};
exports.makeRegisterSupplierPayment = makeRegisterSupplierPayment;
