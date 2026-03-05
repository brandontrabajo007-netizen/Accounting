"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterSupplierHistory = void 0;
const ensureSupplier_1 = require("@accounts-payable/application/services/ensureSupplier");
const makeRegisterSupplierHistory = (deps) => {
    const registerPurchaseHistory = async (input) => {
        if (!input.supplierName?.trim())
            return null;
        if (!Number.isFinite(input.amount) || input.amount <= 0)
            return null;
        const supplier = await (0, ensureSupplier_1.ensureSupplier)(deps.supplierRepository, input.companyId, input.supplierName);
        return deps.supplierHistoryRepository.add({
            companyId: input.companyId,
            supplierId: supplier.id,
            type: 'purchase',
            amount: input.amount,
            date: input.date ?? new Date(),
            description: input.description,
            paymentMethod: input.paymentMethod ?? undefined,
            journalEntryId: input.journalEntryId,
        });
    };
    const registerPaymentHistory = async (input) => {
        if (!input.supplierName?.trim())
            return null;
        if (!Number.isFinite(input.amount) || input.amount <= 0)
            return null;
        const supplier = await (0, ensureSupplier_1.ensureSupplier)(deps.supplierRepository, input.companyId, input.supplierName);
        return deps.supplierHistoryRepository.add({
            companyId: input.companyId,
            supplierId: supplier.id,
            type: 'payment',
            amount: input.amount,
            date: input.date ?? new Date(),
            description: input.description,
            paymentMethod: input.paymentMethod ?? undefined,
            journalEntryId: input.journalEntryId,
        });
    };
    return { registerPurchaseHistory, registerPaymentHistory };
};
exports.makeRegisterSupplierHistory = makeRegisterSupplierHistory;
