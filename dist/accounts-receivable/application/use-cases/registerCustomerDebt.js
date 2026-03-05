"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterCustomerDebt = void 0;
const ensureCustomer_1 = require("../services/ensureCustomer");
const makeRegisterCustomerDebt = (deps) => {
    const registerCustomerDebt = async (input) => {
        if (!input.customerName?.trim())
            return null;
        if (!Number.isFinite(input.amount) || input.amount <= 0)
            return null;
        const customer = await (0, ensureCustomer_1.ensureCustomer)(deps.customerRepository, input.companyId, input.customerName);
        return deps.arEntryRepository.add({
            companyId: input.companyId,
            customerId: customer.id,
            type: 'debit',
            amount: input.amount,
            date: input.date ?? new Date(),
            source: {
                kind: 'sale',
                referenceId: input.source.referenceId,
                note: input.source.note,
            },
        });
    };
    return { registerCustomerDebt };
};
exports.makeRegisterCustomerDebt = makeRegisterCustomerDebt;
