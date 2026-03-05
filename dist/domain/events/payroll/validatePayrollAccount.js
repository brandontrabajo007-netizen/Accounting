"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePayrollAccount = void 0;
const validatePayrollAccount = (config, catalog, event) => {
    const exists = (code) => code && catalog.some((acc) => acc.code === code);
    if (config.expenseAccount && !exists(config.expenseAccount)) {
        throw new Error(`Payroll expense account ${config.expenseAccount} not found in catalog`);
    }
    if (event.paymentMethod === 'cash' && config.cashAccount && !exists(config.cashAccount)) {
        throw new Error(`Cash account ${config.cashAccount} not found in catalog`);
    }
    if (event.paymentMethod === 'bank' && config.bankAccount && !exists(config.bankAccount)) {
        throw new Error(`Bank account ${config.bankAccount} not found in catalog`);
    }
};
exports.validatePayrollAccount = validatePayrollAccount;
