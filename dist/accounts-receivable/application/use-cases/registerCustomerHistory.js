"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterCustomerHistory = void 0;
const ensureCustomer_1 = require("../services/ensureCustomer");
const makeRegisterCustomerHistory = (deps) => {
    const registerSaleHistory = async (input) => {
        if (!input.customerName?.trim())
            return null;
        if (!Number.isFinite(input.amount) || input.amount <= 0)
            return null;
        const customer = await (0, ensureCustomer_1.ensureCustomer)(deps.customerRepository, input.companyId, input.customerName);
        return deps.customerHistoryRepository.add({
            companyId: input.companyId,
            customerId: customer.id,
            type: 'sale',
            amount: input.amount,
            date: input.date ?? new Date(),
            description: input.description,
            paymentMethod: input.paymentMethod ?? undefined,
            journalEntryId: input.journalEntryId,
        });
    };
    const registerPaymentHistory = async (input) => {
        if (!input.customerName?.trim())
            return null;
        if (!Number.isFinite(input.amount) || input.amount <= 0)
            return null;
        const customer = await (0, ensureCustomer_1.ensureCustomer)(deps.customerRepository, input.companyId, input.customerName);
        return deps.customerHistoryRepository.add({
            companyId: input.companyId,
            customerId: customer.id,
            type: 'payment',
            amount: input.amount,
            date: input.date ?? new Date(),
            description: input.description,
            paymentMethod: input.paymentMethod ?? undefined,
            journalEntryId: input.journalEntryId,
        });
    };
    return { registerSaleHistory, registerPaymentHistory };
};
exports.makeRegisterCustomerHistory = makeRegisterCustomerHistory;
