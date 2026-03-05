"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeAccountsPayableOrchestrator = void 0;
const registerSupplierDebt_1 = require("./registerSupplierDebt");
const registerSupplierPayment_1 = require("./registerSupplierPayment");
const isCreditPurchase = (paymentMethod) => paymentMethod === 'credit';
const makeAccountsPayableOrchestrator = (deps) => {
    const { registerSupplierDebt } = (0, registerSupplierDebt_1.makeRegisterSupplierDebt)({
        supplierRepository: deps.supplierRepository,
        apEntryRepository: deps.apEntryRepository,
    });
    const { registerSupplierPayment } = (0, registerSupplierPayment_1.makeRegisterSupplierPayment)({
        supplierRepository: deps.supplierRepository,
        apEntryRepository: deps.apEntryRepository,
    });
    const isEnabled = async (companyId) => {
        const settings = await deps.settingsRepository.getByCompanyId(companyId);
        return settings?.enabled ?? false;
    };
    const registerPurchaseIfNeeded = async (input) => {
        if (!input.supplierName?.trim())
            return null;
        const settings = await deps.settingsRepository.getByCompanyId(input.companyId);
        if (!settings?.enabled)
            return null;
        const shouldCreateDebt = isCreditPurchase(input.paymentMethod ?? null);
        if (!shouldCreateDebt)
            return null;
        return registerSupplierDebt({
            companyId: input.companyId,
            supplierName: input.supplierName,
            amount: input.amount,
            date: input.date,
            source: {
                referenceId: input.journalEntryId,
                note: input.description,
            },
        });
    };
    const registerSupplierPaymentIfNeeded = async (input) => {
        if (!input.supplierName?.trim())
            return null;
        const settings = await deps.settingsRepository.getByCompanyId(input.companyId);
        if (!settings?.enabled)
            return null;
        return registerSupplierPayment({
            companyId: input.companyId,
            supplierName: input.supplierName,
            amount: input.amount,
            date: input.date,
            source: {
                referenceId: input.journalEntryId,
                note: input.paymentMethod ?? input.description,
            },
        });
    };
    return { registerPurchaseIfNeeded, registerSupplierPaymentIfNeeded, isEnabled };
};
exports.makeAccountsPayableOrchestrator = makeAccountsPayableOrchestrator;
