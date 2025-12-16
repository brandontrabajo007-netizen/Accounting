"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePayrollAccount = void 0;
const validatePayrollAccount = (config, catalog, event) => {
    const expense = catalog.find((acc) => acc.code === config.expenseAccount);
    if (!expense) {
        throw new Error(`Payroll expense account ${config.expenseAccount} not found in catalog`);
    }
    if (event.paymentMethod === 'cash') {
        const cash = catalog.find((acc) => acc.code === config.cashAccount);
        if (!cash) {
            throw new Error(`Cash account ${config.cashAccount} not found in catalog`);
        }
    }
    if (event.paymentMethod === 'bank') {
        const bank = catalog.find((acc) => acc.code === config.bankAccount);
        if (!bank) {
            throw new Error(`Bank account ${config.bankAccount} not found in catalog`);
        }
    }
};
exports.validatePayrollAccount = validatePayrollAccount;
