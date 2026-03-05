"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterCustomerPayment = void 0;
const ensureCustomer_1 = require("../services/ensureCustomer");
const makeRegisterCustomerPayment = (deps) => {
    const registerCustomerPayment = async (input) => {
        if (!input.customerName?.trim())
            return null;
        if (!Number.isFinite(input.amount) || input.amount <= 0)
            return null;
        const customer = await (0, ensureCustomer_1.ensureCustomer)(deps.customerRepository, input.companyId, input.customerName);
        return deps.arEntryRepository.add({
            companyId: input.companyId,
            customerId: customer.id,
            type: 'credit',
            amount: input.amount,
            date: input.date ?? new Date(),
            source: {
                kind: 'payment',
                note: input.source?.note,
                referenceId: input.source?.referenceId,
            },
        });
    };
    return { registerCustomerPayment };
};
exports.makeRegisterCustomerPayment = makeRegisterCustomerPayment;
