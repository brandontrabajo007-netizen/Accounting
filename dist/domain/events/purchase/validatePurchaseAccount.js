"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePurchaseAccount = void 0;
const validatePurchaseAccount = (config, catalog, event) => {
    const exists = (code) => code && catalog.some((acc) => acc.code === code);
    if (event.debitAccount && !exists(event.debitAccount)) {
        throw new Error(`Debit account ${event.debitAccount} not found`);
    }
    if (event.includesVAT && config.vatAccount && !exists(config.vatAccount)) {
        throw new Error(`VAT included but vatAccount is missing`);
    }
    if (event.paymentMethod === 'cash' && config.cashAccount && !exists(config.cashAccount)) {
        throw new Error('Cash payment requires cashAccount');
    }
    if (event.paymentMethod === 'bank' && config.bankAccount && !exists(config.bankAccount)) {
        throw new Error('Bank payment requires bankAccount');
    }
    if (event.paymentMethod === 'credit' && config.accountsPayableAccount && !exists(config.accountsPayableAccount)) {
        throw new Error('Credit payment requires accountsPayableAccount');
    }
};
exports.validatePurchaseAccount = validatePurchaseAccount;
