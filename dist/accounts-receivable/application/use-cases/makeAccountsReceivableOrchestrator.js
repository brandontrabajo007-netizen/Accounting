"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeAccountsReceivableOrchestrator = void 0;
const registerCustomerDebt_1 = require("./registerCustomerDebt");
const registerCustomerPayment_1 = require("./registerCustomerPayment");
const normalize = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
const isCreditSale = (paymentMethod, defaultCredit) => {
    if (!paymentMethod)
        return false;
    const normalized = normalize(paymentMethod);
    if (/(credito|a credito|al credito)/.test(normalized))
        return true;
    if (/(efectivo|transferencia|banco|tarjeta|nequi|daviplata)/.test(normalized))
        return false;
    return defaultCredit;
};
const makeAccountsReceivableOrchestrator = (deps) => {
    const { registerCustomerDebt } = (0, registerCustomerDebt_1.makeRegisterCustomerDebt)({
        customerRepository: deps.customerRepository,
        arEntryRepository: deps.arEntryRepository,
    });
    const { registerCustomerPayment } = (0, registerCustomerPayment_1.makeRegisterCustomerPayment)({
        customerRepository: deps.customerRepository,
        arEntryRepository: deps.arEntryRepository,
    });
    const isEnabled = async (companyId) => {
        const settings = await deps.settingsRepository.getByCompanyId(companyId);
        return settings?.enabled ?? false;
    };
    const registerSaleIfNeeded = async (input) => {
        if (!input.customerName?.trim())
            return null;
        const settings = await deps.settingsRepository.getByCompanyId(input.companyId);
        if (!settings?.enabled)
            return null;
        const shouldCreateDebt = isCreditSale(input.paymentMethod ?? null, settings.defaultCreditWhenMissingPaymentMethod);
        if (!shouldCreateDebt)
            return null;
        return registerCustomerDebt({
            companyId: input.companyId,
            customerName: input.customerName,
            amount: input.amount,
            date: input.date,
            source: {
                referenceId: input.journalEntryId,
                note: input.description,
            },
        });
    };
    const registerCustomerPaymentIfNeeded = async (input) => {
        if (!input.customerName?.trim())
            return null;
        const settings = await deps.settingsRepository.getByCompanyId(input.companyId);
        if (!settings?.enabled)
            return null;
        return registerCustomerPayment({
            companyId: input.companyId,
            customerName: input.customerName,
            amount: input.amount,
            date: input.date,
            source: {
                referenceId: input.journalEntryId,
                note: input.paymentMethod ?? input.description,
            },
        });
    };
    return { registerSaleIfNeeded, registerCustomerPaymentIfNeeded, isEnabled };
};
exports.makeAccountsReceivableOrchestrator = makeAccountsReceivableOrchestrator;
